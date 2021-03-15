class Topic < ApplicationRecord
  # Must be prepended first to work for class methods
  Topic.prepend_if_ee 'CustomTopics::Patches::Topic'

  DEFAULT_CODES = %w(nature waste sustainability mobility technology economy housing public_space safety education culture health inclusion community services other)
  
  def self.codes
    DEFAULT_CODES
  end

  acts_as_list column: :ordering, top_of_list: 0, add_new_at: :top
  
  has_many :projects_topics, dependent: :destroy
  has_many :projects, through: :projects_topics
  has_many :ideas_topics, dependent: :destroy
  has_many :ideas, through: :ideas_topics
  has_many :initiatives_topics, dependent: :destroy
  has_many :initiatives, through: :initiatives_topics

  validates :title_multiloc, presence: true, multiloc: {presence: true}
  validates :description_multiloc, multiloc: {presence: false}
  validates :code, inclusion: {in: codes}

  before_validation :strip_title

  scope :order_new, -> (direction=:desc) {
    order(created_at: direction, id: direction)
  }
  scope :defaults, -> {
    where(code: DEFAULT_CODES)
  }
  

  private

  def strip_title
    self.title_multiloc.each do |key, value|
      self.title_multiloc[key] = value.strip
    end
  end
end
