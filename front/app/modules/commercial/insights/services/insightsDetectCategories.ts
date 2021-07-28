import { API_PATH } from 'containers/App/constants';
import streams, { IStreamParams } from 'utils/streams';

const getInsightsDetectCategoriesEndpoint = (viewId: string) =>
  `insights/views/${viewId}/detected_categories`;

export interface IInsightsDetectedCategories {
  data: {
    names: string[];
  };
}

export function insightsDetectedCategoriesStream(
  insightsViewId: string,
  streamParams: IStreamParams | null = null
) {
  return streams.get<IInsightsDetectedCategories>({
    apiEndpoint: `${API_PATH}/${getInsightsDetectCategoriesEndpoint(
      insightsViewId
    )}`,
    ...streamParams,
  });
}
