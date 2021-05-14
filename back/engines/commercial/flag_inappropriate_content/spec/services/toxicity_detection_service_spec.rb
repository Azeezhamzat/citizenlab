require "rails_helper"

describe FlagInappropriateContent::ToxicityDetectionService do
  let(:service) { FlagInappropriateContent::ToxicityDetectionService.new }

  describe "flag_toxicity!" do
    before do
      SettingsService.new.activate_feature! 'flag_inappropriate_content'
      stub_request_toxicity_detection! service
    end

    it "creates a new flag if toxicity was detected" do
      idea = create(:idea, title_multiloc: {'en' => 'An idea for my fellow wankers'})
      service.flag_toxicity! idea, attributes: [:title_multiloc]
      expect(idea.reload.inappropriate_content_flag).to be_present
      expect(idea.reload.inappropriate_content_flag.toxicity_label).to be_present
    end

    it "creates no flag if no toxicity was detected" do
      idea = create(:idea, title_multiloc: {'en' => 'My innocent idea'}, location_description: 'Wankerford')
      service.flag_toxicity! idea, attributes: [:title_multiloc]
      expect(idea.reload.inappropriate_content_flag).to be_blank
    end

    it "reintroduces a deleted flag if no toxicity was detected" do
      comment = create(:comment, body_multiloc: {'en' => 'wanker'})
      flag = create(:inappropriate_content_flag, flaggable: comment, deleted_at: Time.now)
      service.flag_toxicity! comment, attributes: [:body_multiloc]
      expect(comment.reload.inappropriate_content_flag).to be_present
      expect(comment.reload.inappropriate_content_flag.deleted_at).to be_blank
      expect(comment.reload.inappropriate_content_flag.toxicity_label).to be_present
    end

    it "creates no flag if flagging feature is disabled" do
      SettingsService.new.deactivate_feature! 'flag_inappropriate_content'
      idea = create(:idea, title_multiloc: {'en' => 'An idea for my fellow wankers'})
      service.flag_toxicity! idea, attributes: [:title_multiloc]
      expect(idea.reload.inappropriate_content_flag).to be_blank
    end
  end

  private

  def stub_request_toxicity_detection! service
    service.stub(:request_toxicity_detection) do |texts|
      texts.map do |text|
        res = {
          'text' => text,
          'detected_language' => 'es'
        }
        if text.downcase.include? 'wanker'
          res['detected_language'] = 'en'
          res['is_inappropriate'] = true
          res['predictions'] = {
            'threat' => 0.23068441,
            'identity_attack' => 0.27322835,
            'inflammatory' => 0.359929,
            'insult' => 0.70558244,
            'sexually_explicit' => 0.21283324
          }
        end
        res
      end
    end
  end

end
