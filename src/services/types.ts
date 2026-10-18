export interface WeatherResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset_seconds: number;
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
}

export interface HourlyRow {
  no: number;
  time: string;
  wib: string;
  temperature: number;
}
