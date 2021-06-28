require 'rails_helper'
require 'rspec_api_documentation/dsl'

resource "Stats - Inputs" do
  explanation "The various stats endpoints can be used to show certain properties of inputs."

  before { header 'Content-Type', 'application/json' }

  let(:view) { create(:view) }
  let(:view_id) { view.id }
  let(:ideas) { create_list(:idea, 5, project: view.scope) }
  let(:other_ideas) { create_list(:idea, 4) }

  let(:json_response) { json_parse(response_body) }
  let(:assignment_service) { Insights::CategoryAssignmentsService.new }

  shared_examples 'unauthorized requests' do
    context 'when visitor' do
      example_request('unauthorized', document: false) { expect(status).to eq(401) }
    end

    context 'when normal user' do
      before { user_header_token }

      example_request('unauthorized', document: false) { expect(status).to eq(401) }
    end
  end

  get "web_api/v1/insights/views/:view_id/stats/inputs_count" do
    parameter :category, 'Filter by category', required: false

    context 'when admin' do
      before { admin_header_token }

      example_request "Count all inputs" do
        expect(response_status).to eq 200
        json_response = json_parse(response_body)
        expect(json_response[:count]).to eq view.scope.ideas.count
      end

      context 'with categories filter' do
        let(:category) { create(:category, view: view) }
        before { assignment_service.add_assignments_batch(ideas.take(2), [category]) }

        example 'Count for one category', document: false do
          do_request(category: category.id)

          expect(response_status).to eq 200
          json_response = json_parse(response_body)
          expect(json_response[:count]).to eq 2
        end

        example 'Count uncategorized', document: false do
          do_request(category: '')

          expect(response_status).to eq 200
          json_response = json_parse(response_body)
          expect(json_response[:count]).to eq 3
        end
      end

    end
    include_examples 'unauthorized requests'
  end
end
