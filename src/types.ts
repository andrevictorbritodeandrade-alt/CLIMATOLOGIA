export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  temp_max: number;
  temp_min: number;
  windSpeed: number;
  windGust: number;
  windDir: string;
  windDeg: number;
  rain1h: number;
  visibility: number;
  weatherCode: number;
  description: string;
}

export interface DailyForecast {
  date: string;
  temp_max: number;
  temp_min: number;
  wind_avg: number;
  wind_gust_max: number;
  wind_deg_common: number;
  rain_mm: number;
  pop: number; // Probability of precipitation
  weatherCode: number;
  main_desc: string;
}

export interface HourlyForecast {
  time: Date;
  temp: number;
  humidity: number;
  feels: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust: number;
  pressure: number;
  precip_prob: number;
  precip: number;
  weatherCode: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string; // State
  admin2?: string; // City / Municipality
}

export interface GeminiAnalysis {
  clothing: string;
  activities: string;
  safetyAlerts: string;
  summary: string;
  loading?: boolean;
  _fallback?: boolean;
}

export interface FavoriteCity {
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  country?: string;
}
