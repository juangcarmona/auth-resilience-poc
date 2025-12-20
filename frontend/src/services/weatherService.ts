import { apiClient } from './apiClient';

export interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

export interface RecomputeOptions {
  days?: number;
  resolution?: 'low' | 'medium' | 'high';
  model?: 'standard' | 'experimental';
}

export const weatherService = {
  getPublicForecast: async (): Promise<WeatherForecast[]> => {
    return apiClient.get<WeatherForecast[]>('/api/weather');
  },

  recomputeWeatherData: async (options?: RecomputeOptions): Promise<string> => {
    return apiClient.postText('/api/weather/operations/recompute', options);
  },
};
