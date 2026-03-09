// Stub — real implementation pending from teammate
export type SeriesEndpointConfig = {
  url: string;
  priority: number;
};

export function buildSeriesEndpointConfigs(_seriesId: string): SeriesEndpointConfig[] {
  return [];
}

export function rankSeriesEndpointConfigs(
  configs: SeriesEndpointConfig[],
  _preferredUrl: string | undefined,
  _exhaustive: boolean,
): SeriesEndpointConfig[] {
  return configs;
}
