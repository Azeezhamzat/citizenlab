module Insights
  module WebApi::V1
    class StatsInputsController < ::ApplicationController
      def inputs_count
        @result = Insights::InputsFinder.new(view, counts_params).execute

        render json: { count: @result.count }
      end

      private

      # @return [Insights::View]
      def view
        @view ||= authorize(
          View.includes(:scope).find(params.require(:view_id)),
          :show?
        )
      end

      def counts_params
        @counts_params ||= params.permit(
          :category,
          :search
        )
      end
    end
  end
end
