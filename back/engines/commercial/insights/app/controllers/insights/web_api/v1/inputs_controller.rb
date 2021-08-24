# frozen_string_literal: true

module Insights
  module WebApi::V1
    class InputsController < ::ApplicationController
      skip_after_action :verify_policy_scoped, only: [:index, :index_xlsx] # The view is authorized instead.

      def show
        render json: InputSerializer.new(input, serialize_options), status: :ok
      end

      def index
        # index is not policy scoped, instead the view is authorized.
        inputs = Insights::InputsFinder.new(view, index_params).execute
        render json: linked_json(inputs, InputSerializer, serialize_options)
      end

      def index_xlsx
        # index_xlsx is not policy scoped, instead the view is authorized.
        inputs = Insights::InputsFinder.new(view, index_xlsx_params).execute
        categories = view.categories
        xlsx = xlsx_service.generate_inputs_xlsx inputs,
                                                 categories,
                                                 view_private_attributes: Pundit.policy!(current_user,
                                                                                         User).view_private_attributes?

        send_data xlsx, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        filename: 'inputs.xlsx'
      end

      private

      def index_params
        @index_params ||= params.permit(
          :category,
          :search,
          :sort,
          :processed,
          page: %i[number size]
        )
      end

      def index_xlsx_params
        @index_xlsx_params ||= params.permit(
          :category,
          :processed,
        )
      end

      def assignment_service
        @assignment_service ||= Insights::CategoryAssignmentsService.new
      end

      def xlsx_service
        @xlsx_service ||= Insights::XlsxService.new
      end

      # @return [Insights::View]
      def view
        @view ||= authorize(
          View.includes(:scope).find(params.require(:view_id)),
          :show?
        )
      end

      def input
        @input ||= authorize(
          view.scope.ideas.find(params.require(:id))
        )
      end

      def serialize_options()
        {
          include: %i[categories suggested_categories source],
          fields: { idea: [:title_multiloc, :body_multiloc] },
          params: { view: view }
        }
      end
    end
  end
end
