require 'rails_helper'
require 'rspec_api_documentation/dsl'

resource "Baskets" do

  explanation 'A collection of ideas selected by the citizen during participatory budgeting. AKA "cart" (US), "buggy" (American south), "carriage" (New England) or "trolley"'

  before do
    header "Content-Type", "application/json"

    @user = create(:user)
    @ideas = create_list(:idea, 3)
    create_list(:basket, 2, participation_context: create(:continuous_budgeting_project, with_permissions: true))
    @basket = create(:basket, ideas: @ideas, user: @user, participation_context: create(:continuous_budgeting_project, with_permissions: true))
  end

  get "web_api/v1/baskets/:basket_id" do
    let(:basket_id) { @basket.id }

    context "when authenticated" do
      before do
        token = Knock::AuthToken.new(payload: { sub: @user.id }).token
        header 'Authorization', "Bearer #{token}"
      end

      example_request "Get one basket by id" do
        expect(status).to eq 200
        json_response = json_parse(response_body)
        expect(json_response.dig(:data, :id)).to eq @basket.id
        expect(json_response.dig(:data, :attributes, :total_budget)).to be_present
        expect(json_response.dig(:data, :attributes, :budget_exceeds_limit?)).not_to eq nil
        expect(json_response.dig(:data, :relationships, :ideas, :data).map{|h| h[:id]}).to match_array @ideas.map(&:id)
        expect(json_response.dig(:included).map{|h| h.dig(:attributes, :slug)}).to match_array @ideas.map(&:slug)
      end
    end
  end

  post "web_api/v1/baskets" do
    with_options scope: :basket do
      parameter :submitted_at, "The time at which the basket was submitted to the city", required: false
      parameter :user_id, "The id of the user to whom the basket belongs", required: true
      parameter :participation_context_id, "The id of the phase/project to whom the basket belongs", required: true
      parameter :participation_context_type, "The type of the participation context (e.g. Project, Phase)", required: true
      parameter :idea_ids, "An array of idea ids that have been added to basket", required: false
    end
    ValidationErrorHelper.new.error_fields(self, Basket)

    context "when authenticated" do
      before do
        token = Knock::AuthToken.new(payload: { sub: @user.id }).token
        header 'Authorization', "Bearer #{token}"
      end

      let(:basket) { build(:basket, user: @user, participation_context: create(:continuous_budgeting_project, with_permissions: true)) }
      let(:user_id) { basket.user_id }
      let(:participation_context_id) { basket.participation_context_id }
      let(:participation_context_type) { basket.participation_context_type }
      let(:idea_ids) { basket.idea_ids }

      example_request "Create a basket" do
        expect(response_status).to eq 201
        json_response = json_parse(response_body)
        expect(json_response.dig(:data, :relationships, :user, :data, :id)).to eq user_id
        expect(json_response.dig(:data, :relationships, :ideas, :data).map{|h| h[:id]}).to match_array basket.idea_ids
        expect(json_response.dig(:data, :relationships, :participation_context, :data, :id)).to eq participation_context_id
      end

      example "[error] Create a basket in a survey" do
        do_request(
          basket: {
            participation_context_id: create(:continuous_survey_project, with_permissions: true).id, 
            participation_context_type: 'Project'
          }) 

        expect(response_status).to be >= 400
      end
    end
  end

  patch "web_api/v1/baskets/:basket_id" do
    with_options scope: :basket do
      parameter :submitted_at, "The time at which the basket was submitted to the city"
      parameter :user_id, "The id of the user to whom the basket belongs"
      parameter :participation_context_id, "The id of the phase/project to whom the basket belongs"
      parameter :participation_context_type, "The type of the participation context (e.g. Project, Phase)"
      parameter :idea_ids, "An array of idea ids that have been added to basket"
    end
    ValidationErrorHelper.new.error_fields(self, Basket)

    context "when authenticated" do
      before do
        token = Knock::AuthToken.new(payload: { sub: @user.id }).token
        header 'Authorization', "Bearer #{token}"
      end

      let(:basket_id) { @basket.id }
      let(:idea_ids) { create_list(:idea, 3).map(&:id) }

      example_request "Update a basket" do
        expect(response_status).to eq 200
        json_response = json_parse(response_body)
        expect(json_response.dig(:data, :relationships, :ideas, :data).map{|h| h[:id]}).to match_array idea_ids
      end

      example "'baskets_count' is not updated when adding/removing the idea to an unsubmitted basket", document: false do
        idea = create(:idea)
        @basket.update!(ideas: [idea])
        old_baskets_count = idea.reload.baskets_count

        do_request basket: {idea_ids: idea_ids, submitted_at: nil}
        expect(idea.reload.baskets_count).to eq old_baskets_count 
      end

      example "'baskets_count' is updated when adding/removing the idea to a submitted basket", document: false do
        idea = create(:idea)
        @basket.update!(ideas: [idea])
        old_baskets_count = idea.reload.baskets_count

        do_request basket: {idea_ids: idea_ids, submitted_at: Time.now}
        expect(idea.reload.baskets_count).not_to eq old_baskets_count 
      end

      describe "'baskets_count' stay up to date after removing an idea from the basket" do
        before do
          @trolley = create_list(:basket, 3, ideas: [idea], participation_context: create(:continuous_budgeting_project, with_permissions: true)).first
          @trolley.update(user: @user)
        end

        let(:idea) { create(:idea) }
        let(:idea_ids) { [] }
        let(:basket_id) { @trolley.id }
        let(:submitted_at) { Time.now }

        example '', document: false do
          do_request
          expect(idea.reload.baskets_count).to eq 2
        end
      end
    end
  end

  delete "web_api/v1/baskets/:basket_id" do
    context "when authenticated" do
      before do
        token = Knock::AuthToken.new(payload: { sub: @user.id }).token
        header 'Authorization', "Bearer #{token}"
      end

      let(:basket_id) { @basket.id }

      example "Delete a basket" do
        old_count = Basket.count
        do_request
        expect(response_status).to eq 200
        expect{Basket.find(basket_id)}.to raise_error(ActiveRecord::RecordNotFound)
        expect(Basket.count).to eq (old_count - 1)
      end
    end
  end
end