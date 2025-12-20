import { apiClient } from './apiClient';

export interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string;
}

export const weatherService = {
  getPublicForecast: async (): Promise<WeatherForecast[]> => {
    return apiClient.get<WeatherForecast[]>('/api/weather');
  },

  recomputeWeatherData: async (): Promise<string> => {
    return apiClient.postText('/api/weather/operations/recompute');
  },
};
