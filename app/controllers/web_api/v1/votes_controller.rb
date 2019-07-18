class WebApi::V1::VotesController < ApplicationController
  before_action :set_vote, only: [:show, :destroy]
  before_action :set_votable_type_and_id, only: [:index, :create, :up, :down]

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  def index
    @votes = policy_scope(Vote, policy_scope_class: @policy_class::Scope)
      .where(votable_type: @votable_type, votable_id: @votable_id)
      .includes(:user)
      .page(params.dig(:page, :number))
      .per(params.dig(:page, :size))

    render json: linked_json(@votes, WebApi::V1::VoteSerializer, params: fastjson_params, include: [:user])
  end

  def show
    render json: WebApi::V1::VoteSerializer.new(
      @vote, 
      params: fastjson_params, 
      include: [:user]
      ).serialized_json
  end

  def create
    @vote = Vote.new(vote_params)
    @vote.votable_type = @votable_type
    @vote.votable_id = @votable_id
    @vote.user ||= current_user
    authorize @vote, policy_class: @policy_class

    SideFxVoteService.new.before_create(@vote, current_user)

    if @vote.save
      SideFxVoteService.new.after_create(@vote, current_user)
      render json: WebApi::V1::VoteSerializer.new(
        @vote, 
        params: fastjson_params
        ).serialized_json, status: :created
    else
      render json: { errors: @vote.errors.details }, status: :unprocessable_entity
    end
  end

  def up
    upsert_vote "up"
  end

  def down
    upsert_vote "down"
  end

  def destroy
    SideFxVoteService.new.before_destroy(@vote, current_user)
    frozen_vote = @vote.destroy
    if frozen_vote
      SideFxVoteService.new.after_destroy(frozen_vote, current_user)
      head :ok
    else
      head 500
    end
  end

  private

  def upsert_vote mode

    @old_vote = Vote.find_by(
      user: current_user, 
      votable_type: @votable_type,
      votable_id: @votable_id
    )

    if @old_vote && @old_vote.mode == mode
      authorize @old_vote, policy_class: @policy_class
      @old_vote.errors.add(:base, "already_#{mode}voted")
      render json: {errors: @old_vote.errors.details}, status: :unprocessable_entity
    else
      Vote.transaction do
        if @old_vote
          old_vote_frozen = @old_vote.destroy
          SideFxVoteService.new.after_destroy(old_vote_frozen, current_user)
        end
        @new_vote = Vote.new(
          user: current_user, 
          votable_type: @votable_type,
          votable_id: @votable_id,
          mode: mode
        )
        authorize @new_vote, policy_class: @policy_class

        SideFxVoteService.new.before_create(@new_vote, current_user)

        if @new_vote.save
          SideFxVoteService.new.after_create(@new_vote, current_user)
          render json: WebApi::V1::VoteSerializer.new(
            @vote, 
            params: fastjson_params
            ).serialized_json, status: :created
        else
          render json: {errors: @new_vote.errors.details}, status: :unprocessable_entity
        end
      end
    end

  end

  def set_votable_type_and_id
    @votable_type = params[:votable]
    @votable_id = params[:"#{@votable_type.underscore}_id"]
    @policy_class = case @votable_type
      when 'Idea' then IdeaVotePolicy
      when 'Comment' then CommentVotePolicy
      when 'Initiative' then InitiativeVotePolicy
      else raise "#{@votable_type} has no voting policy defined"
    end
    raise RuntimeError, "must not be blank" if @votable_type.blank? or @votable_id.blank?
  end

  def derive_policy_class votable
    if votable.kind_of? Idea
      IdeaVotePolicy
    elsif votable.kind_of? Comment
      CommentVotePolicy
    elsif votable.kind_of? Initiative
      InitiativeVotePolicy
    else
      raise "Votable #{votable.class} has no voting policy defined"
    end
  end

  def set_vote
    @vote = Vote.find(params[:id])
    @policy_class = derive_policy_class(@vote.votable)
    authorize @vote, policy_class: @policy_class
  end

  def vote_params
    params.require(:vote).permit(
      :user_id,
      :mode,
    )
  end

  def secure_controller?
    false
  end

  def user_not_authorized exception
    pcs = ParticipationContextService.new
    if exception.record.votable.kind_of? Idea
      reason = pcs.voting_disabled_reason_for_idea exception.record.votable, exception.record.user
      reason ||= pcs.cancelling_votes_disabled_reason(exception.record.votable, exception.record.user)
    elsif exception.record.votable.kind_of?(Initiative) && exception.record.mode == 'down'
      reason = 'downvoting_not_supported'
    elsif exception.record.votable.kind_of? Comment
      reason = pcs.voting_disabled_reason_for_comment exception.record.votable, exception.record.user
    else
      raise "No voting disabled reasons can be determined for #{exception.record.votable.class} models"
    end
    if reason
      render json: { errors: { base: [{ error: reason }] } }, status: :unauthorized
      return
    end
    render json: { errors: { base: [{ error: 'Unauthorized!' }] } }, status: :unauthorized
  end

end
