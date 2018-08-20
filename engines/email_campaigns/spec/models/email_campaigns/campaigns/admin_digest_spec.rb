require 'rails_helper'

RSpec.describe EmailCampaigns::Campaigns::AdminDigest, type: :model do
  describe "AdminDigest Campaign default factory" do
    it "is valid" do
      expect(build(:admin_digest_campaign)).to be_valid
    end
  end

  describe '#generate_command' do
  	let(:campaign) { create(:admin_digest_campaign) }
  	let!(:admin) { create(:admin) }
    let!(:old_ideas) { create_list(:idea, 2, published_at: Time.now - 20.days) }
    let!(:new_ideas) { create_list(:idea, 3, published_at: Time.now - 1.day) }
    let!(:vote) { create(:vote, mode: 'up', votable: new_ideas.first) }
    let!(:draft) { create(:idea, publication_status: 'draft') }

  	it "generates a comment with the desired payload and tracked content" do
  		command = campaign.generate_command recipient: admin

      expect(
      	command.dig(:event_payload, :statistics, :activities, :new_ideas, :increase)
      	).to eq(new_ideas.size)
      expect(
      	command.dig(:event_payload, :statistics, :activities, :new_votes, :increase)
      	).to eq(1)
      expect(
      	command.dig(:event_payload, :top_project_ideas).flat_map{|tpi| tpi[:top_ideas].map{|ti| ti[:id]}}
      	).to include(new_ideas.first.id)
      expect(
      	command.dig(:event_payload, :top_project_ideas).flat_map{|tpi| tpi[:top_ideas].map{|ti| ti[:id]}}
      	).not_to include(draft.id)
      expect(command.dig(:tracked_content, :idea_ids)).to include(new_ideas.first.id)
  	end
  end

end
