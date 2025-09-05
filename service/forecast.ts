// service/api.ts
export const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
export const OPENWEATHER_API_KEY = '04c7645d4edef2acf6537b52966af7b6'; // replace with env var in production

export class WeatherAPIError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WeatherAPIError';
    this.status = status;
  }
}

/**
 * Raw response types from OpenWeather `forecast` endpoint (only fields we need)
 */
export interface RawForecastItem {
  dt: number; // unix timestamp (seconds)
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    // ...other fields
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  dt_txt?: string;
}

export interface RawForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: RawForecastItem[];
  city: {
    id: number;
    name: string;
    country: string;
    // ...other
  };
}

/**
 * Normalized forecast model your UI uses
 */
export interface HourlyForecast {
  dt: number;
  temp: number;
  icon: string;
  description: string;
}

export interface DailyForecast {
  date: string; // yyyy-mm-dd
  tempMin: number;
  tempMax: number;
  icon: string; // most frequent icon or first
  description: string;
}

export interface ForecastData {
  cityName: string;
  hourly: HourlyForecast[]; // chronological
  daily: DailyForecast[];   // chronological
}

/**
 * Fetch forecast (5 day / 3 hour) and normalize for UI
 */
export async function getForecastByCoords(
  latitude: number,
  longitude: number
): Promise<ForecastData> {
  try {
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new WeatherAPIError('Failed to fetch forecast data', response.status);
    }

    const data = (await response.json()) as RawForecastResponse;

    // Build hourly: take next 5 entries (3-hour steps)
    const now = Date.now() / 1000;
    const nextItems = data.list.filter(item => item.dt >= now).slice(0, 5);
    const hourly: HourlyForecast[] = nextItems.map(item => ({
      dt: item.dt,
      temp: Math.round(item.main.temp),
      icon: item.weather?.[0]?.icon ?? '01d',
      description: item.weather?.[0]?.description ?? '',
    }));

    // Build daily: group by date (yyyy-mm-dd) and compute min/max
    const grouped: Record<string, RawForecastItem[]> = {};
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().slice(0, 10);
      grouped[date] = grouped[date] || [];
      grouped[date].push(item);
    });

    // Take next 5 days starting today (or tomorrow if today partial)
    const days = Object.keys(grouped)
      .sort()
      .slice(0, 6); // slice a little more so we can pick "next 5 meaningful days"

    const daily: DailyForecast[] = days.slice(0, 5).map(date => {
      const items = grouped[date];
      const temps = items.map(i => i.main.temp);
      const min = Math.round(Math.min(...temps));
      const max = Math.round(Math.max(...temps));
      // pick most frequent icon (simple heuristic)
      const iconCounts: Record<string, number> = {};
      items.forEach(i => {
        const icon = i.weather?.[0]?.icon ?? '01d';
        iconCounts[icon] = (iconCounts[icon] || 0) + 1;
      });
      const icon = Object.entries(iconCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? items[0].weather?.[0]?.icon ?? '01d';
      const description = items[0].weather?.[0]?.description ?? '';

      return {
        date,
        tempMin: min,
        tempMax: max,
        icon,
        description,
      };
    });

    return {
      cityName: data.city?.name ?? '',
      hourly,
      daily,
    };
  } catch (error) {
    if (error instanceof WeatherAPIError) throw error;
    console.error('Error fetching forecast:', error);
    throw new WeatherAPIError('Network error while fetching forecast data');
  }
}

