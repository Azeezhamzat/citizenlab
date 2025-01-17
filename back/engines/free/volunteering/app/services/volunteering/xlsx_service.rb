# frozen_string_literal: true

module Volunteering
  class XlsxService
    @@multiloc_service = MultilocService.new

    def generate_xlsx(
      participation_context,
      volunteers,
      view_private_attributes: false
    )
      xlsx_service = ::XlsxService.new
      columns = [
        { header: 'first_name', f: ->(v) { v.user.first_name } },
        { header: 'last_name',  f: ->(v) { v.user.last_name } },
        { header: 'email',      f: ->(v) { v.user.email } },
        { header: 'date',       f: ->(v) { v.created_at }, skip_sanitization: true }
      ]

      unless view_private_attributes
        columns.select! do |c|
          %w[email].exclude?(c[:header])
        end
      end

      pa = Axlsx::Package.new

      participation_context.causes.order(:ordering).each do |cause|
        sheetname = sanitize_title @@multiloc_service.t(cause.title_multiloc)
        xlsx_service.generate_sheet pa.workbook, sheetname, columns, volunteers.where(cause: cause)
      end

      pa.to_stream
    end

    private

    # Sheet names, derived from Cause titles, can only be 31 characters long,
    # and cannot contain the characters \ , / , * , ? , : , [ , ].
    # We are being strict and removing any character that is not alphanumeric or a space.
    def sanitize_title(title)
      title[0..30].gsub(/[^A-Za-z0-9 ]/, '')
    end
  end
end
