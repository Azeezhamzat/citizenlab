# frozen_string_literal: true

class ParticipationContextService
  POSTING_DISABLED_REASONS = {
    project_inactive: 'project_inactive',
    not_ideation: 'not_ideation',
    posting_disabled: 'posting_disabled'
  }.freeze

  COMMENTING_DISABLED_REASONS = {
    project_inactive: 'project_inactive',
    not_supported: 'not_supported',
    idea_not_in_current_phase: 'idea_not_in_current_phase',
    commenting_disabled: 'commenting_disabled'
  }.freeze

  VOTING_DISABLED_REASONS = {
    project_inactive: 'project_inactive',
    not_ideation: 'not_ideation',
    voting_disabled: 'voting_disabled',
    downvoting_disabled: 'downvoting_disabled',
    voting_limited_max_reached: 'voting_limited_max_reached',
    idea_not_in_current_phase: 'idea_not_in_current_phase'
  }.freeze

  BUDGETING_DISABLED_REASONS = {
    project_inactive: 'project_inactive',
    idea_not_in_current_phase: 'idea_not_in_current_phase'
  }.freeze

  TAKING_SURVEY_DISABLED_REASONS = {
    project_inactive: 'project_inactive',
    not_survey: 'not_survey'
  }.freeze

  TAKING_POLL_DISABLED_REASONS = {
    project_inactive: 'project_inactive',
    not_poll: 'not_poll',
    already_responded: 'already_responded'
  }.freeze

  def initialize
    @memoized_votes_in_context = Hash.new { |hash, key| hash[key] = {} }
    @timeline_service = TimelineService.new
    @verification_service = Verification::VerificationService.new
    @permission_service = PermissionsService.new
  end

  def get_participation_context(project)
    if project.admin_publication.archived?
      nil
    elsif project.continuous?
      project
    elsif project.timeline?
      @timeline_service.current_phase project
    end
  end

  def in_current_context?(idea, current_context = nil)
    project = idea.project
    current_context ||= get_participation_context project
    if project.continuous?
      true
    else
      idea.ideas_phases.find { |ip| ip.phase_id == current_context.id }
    end
  end

  def participation_possible_for_context?(context, user)
    !(posting_idea_disabled_reason_for_context(context, user)\
    && commenting_idea_disabled_reason_for_context(context, user)\
    && voting_idea_disabled_reason_for_context(context, user)\
    && taking_survey_disabled_reason_for_context(context, user)\
    && budgeting_disabled_reason_for_context(context, user))
  end

  def posting_idea_disabled_reason_for_project(project, user)
    context = project && get_participation_context(project)
    posting_idea_disabled_reason_for_context context, user
  end

  def posting_idea_disabled_reason_for_context(context, user)
    if !context
      POSTING_DISABLED_REASONS[:project_inactive]
    elsif !context.ideation?
      POSTING_DISABLED_REASONS[:not_ideation]
    elsif !context.posting_enabled
      POSTING_DISABLED_REASONS[:posting_disabled]
    else
      @permission_service.denied?(user, 'posting_idea', context)
    end
  end

  def commenting_disabled_reason_for_idea(idea, user)
    active_context = get_participation_context idea.project
    if !active_context
      COMMENTING_DISABLED_REASONS[:project_inactive]
    elsif !in_current_context? idea, active_context
      COMMENTING_DISABLED_REASONS[:idea_not_in_current_phase]
    else
      commenting_idea_disabled_reason_for_project(idea.project, user)
    end
  end

  def commenting_idea_disabled_reason_for_project(project, user)
    context = get_participation_context project
    commenting_idea_disabled_reason_for_context context, user
  end

  def commenting_idea_disabled_reason_for_context(context, user)
    if !context
      COMMENTING_DISABLED_REASONS[:project_inactive]
    elsif !context.can_contain_ideas?
      COMMENTING_DISABLED_REASONS[:not_supported]
    elsif !context.commenting_enabled
      COMMENTING_DISABLED_REASONS[:commenting_disabled]
    else
      @permission_service.denied?(user, 'commenting_idea', context)
    end
  end

  def voting_disabled_reason_for_idea_vote(vote, user)
    idea = vote.votable
    if vote.down? && !get_participation_context(idea.project)&.downvoting_enabled
      return VOTING_DISABLED_REASONS[:downvoting_disabled]
    end

    voting_disabled_reason_for_idea idea, user
  end

  def voting_disabled_reason_for_idea_comment(comment, user)
    commenting_disabled_reason_for_idea comment.post, user
  end

  def voting_disabled_reason_for_idea(idea, user)
    context = get_participation_context idea.project
    if !context
      VOTING_DISABLED_REASONS[:project_inactive]
    elsif !in_current_context? idea, context
      VOTING_DISABLED_REASONS[:idea_not_in_current_phase]
    else
      voting_idea_disabled_reason_for_project(idea.project, user)
    end
  end

  def voting_idea_disabled_reason_for_project(project, user)
    context = get_participation_context project
    voting_idea_disabled_reason_for_context context, user
  end

  def voting_idea_disabled_reason_for_context(context, user)
    if !context
      VOTING_DISABLED_REASONS[:project_inactive]
    elsif !context.ideation?
      VOTING_DISABLED_REASONS[:not_ideation]
    elsif !context.voting_enabled
      VOTING_DISABLED_REASONS[:voting_disabled]
    elsif user && voting_limit_reached?(context, user)
      VOTING_DISABLED_REASONS[:voting_limited_max_reached]
    else
      @permission_service.denied?(user, 'voting_idea', context)
    end
  end

  def cancelling_votes_disabled_reason_for_idea(idea, user)
    context = get_participation_context idea.project
    if !context
      VOTING_DISABLED_REASONS[:project_inactive]
    elsif !context.ideation?
      VOTING_DISABLED_REASONS[:not_ideation]
    elsif !in_current_context? idea, context
      VOTING_DISABLED_REASONS[:idea_not_in_current_phase]
    elsif !context.voting_enabled
      VOTING_DISABLED_REASONS[:voting_disabled]
    else
      @permission_service.denied?(user, 'voting_idea', context)
    end
  end

  def taking_survey_disabled_reason_for_project(project, user)
    context = get_participation_context project
    taking_survey_disabled_reason_for_context context, user
  end

  def taking_survey_disabled_reason_for_context(context, user)
    if !context
      TAKING_SURVEY_DISABLED_REASONS[:project_inactive]
    elsif !context.survey?
      TAKING_SURVEY_DISABLED_REASONS[:not_survey]
    else
      @permission_service.denied?(user, 'taking_survey', context)
    end
  end

  def taking_poll_disabled_reason_for_project(project, user)
    context = get_participation_context project
    taking_poll_disabled_reason_for_context context, user
  end

  def taking_poll_disabled_reason_for_context(context, user)
    if !context
      TAKING_POLL_DISABLED_REASONS[:project_inactive]
    elsif !context.poll?
      TAKING_POLL_DISABLED_REASONS[:not_poll]
    elsif user && context.poll_responses.exists?(user: user)
      TAKING_POLL_DISABLED_REASONS[:already_responded]
    else
      @permission_service.denied?(user, 'taking_poll', context)
    end
  end

  def budgeting_disabled_reason_for_idea(idea, user)
    context = get_participation_context idea.project
    if context && !in_current_context?(idea, context)
      BUDGETING_DISABLED_REASONS[:idea_not_in_current_phase]
    else
      budgeting_disabled_reason_for_context context, user
    end
  end

  def budgeting_disabled_reason_for_context(context, user)
    if !context
      BUDGETING_DISABLED_REASONS[:project_inactive]
    else
      @permission_service.denied?(user, 'budgeting', context)
    end
  end

  def future_posting_idea_enabled_phase(project, user, time = Time.zone.now)
    return nil unless project.timeline?

    @timeline_service.future_phases(project, time).find do |phase|
      phase.posting_enabled && context_permission(phase, 'posting_idea')&.granted_to?(user)
    end
  end

  def future_commenting_idea_enabled_phase(project, user, time = Time.zone.now)
    return nil unless project.timeline?

    @timeline_service.future_phases(project, time).find do |phase|
      phase.can_contain_ideas? && phase.commenting_enabled && context_permission(phase, 'commenting_idea')&.granted_to?(user)
    end
  end

  def future_voting_idea_enabled_phase(project, user, time = Time.zone.now)
    return nil unless project.timeline?

    @timeline_service.future_phases(project, time).find do |phase|
      phase.can_contain_ideas? && phase.voting_enabled && context_permission(phase, 'voting_idea')&.granted_to?(user)
    end
  end

  def future_comment_voting_idea_enabled_phase(project, user, time = Time.zone.now)
    future_commenting_idea_enabled_phase project, user, time
  end

  def future_budgeting_enabled_phase(project, user, time = Time.zone.now)
    return nil unless project.timeline?

    @timeline_service.future_phases(project, time).find do |phase|
      context_permission(phase, 'budgeting')&.granted_to?(user)
    end
  end

  def moderating_participation_context_ids(user)
    project_ids = user.moderatable_project_ids
    phase_ids = Phase.where(project_id: project_ids).pluck(:id)
    project_ids + phase_ids
  end

  def allocated_budget(project)
    Idea.from(project.ideas.select('budget * baskets_count as allocated_budget')).sum(:allocated_budget)
  end

  def allocated_budgets(projects)
    Idea.from(Idea.where(project: projects).select('project_id, budget * baskets_count as allocated_budget')).group(:project_id).sum(:allocated_budget)
  end

  private

  def voting_limit_reached?(context, user)
    return unless context.voting_limited?

    votes_in_context(context, user) >= context.voting_limited_max
  end

  def votes_in_context(context, user)
    @memoized_votes_in_context[context.id][user.id] ||= calculate_votes_in_context(context, user)
  end

  def calculate_votes_in_context(context, user)
    user.votes.where(votable_id: context.ideas).count
  end

  def context_permission(context, action)
    # We use ruby #find instead of SQL to have a higher chance of hitting
    # ActiveRecord's query cache, since this can be repeated a lot for the
    # same context.
    context.permissions.includes(:groups).find { |permission| permission.action == action }
  end
end
