module FlagInappropriateContent
  module Extensions
    module NLP
      module Api # API
        def toxicity_detection texts
          body = {
            texts: texts
          }
          resp = post(
            '/v2/toxic_classification',
            body: body.to_json,
            headers: { 'Content-Type' => 'application/json' },
            timeout: LONG_TIMEOUT
          )
          if !resp.success?
            raise ClErrors::TransactionError.new(error_key: resp['code'])
          end
          resp.parsed_response.dig('data')
        end
      end
    end
  end
end