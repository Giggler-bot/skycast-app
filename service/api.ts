// services/api.ts
import * as Location from 'expo-location';

// Replace with your OpenWeather API key
const OPENWEATHER_API_KEY = '04c7645d4edef2acf6537b52966af7b6';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_BASE_URL = 'http://api.openweathermap.org/geo/1.0';

// Types
export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  coord: {
    lat: number;
    lon: number;
  };
  name: string;
  dt: number;
  visibility: number;
}

export interface LocationData {
  name: string;
  country: string;
  coords: {
    latitude: number;
    longitude: number;
  };
}

export interface CitySuggestion {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
  id: number
}


export interface ForecastData {
  list: {
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: {
      main: string;
      description: string;
      icon: string;
    }[];
    wind: {
      speed: number;
    };
    dt_txt: string;
  }[];
  city: {
    name: string;
    country: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
}

// API Error class
export class WeatherAPIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'WeatherAPIError';
  }
}

// Location Services
export const locationService = {
  /**
   * Request location permissions from user
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw new WeatherAPIError('Failed to request location permission');
    }
  },

  /**
   * Get current user location coordinates
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new WeatherAPIError('Failed to get current location');
    }
  },
};

// Weather API Services
export const weatherService = {
  /**
   * Fetch current weather data by coordinates
   */
   
  async getWeatherByCoords(
    latitude: number,
    longitude: number
  ): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new WeatherAPIError('Location not found', 404);
        }
        throw new WeatherAPIError('Failed to fetch weather data', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      console.error('Error fetching weather by coordinates:', error);
      throw new WeatherAPIError('Network error while fetching weather data');
    }
  },

  /**
   * Fetch current weather data by city name
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${OPENWEATHER_BASE_URL}/weather?q=${encodeURIComponent(
          cityName
        )}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new WeatherAPIError(
            'City not found. Please check the spelling and try again.',
            404
          );
        }
        throw new WeatherAPIError('Failed to fetch weather data', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      console.error('Error fetching weather by city:', error);
      throw new WeatherAPIError('Network error while fetching weather data');
    }
  },

  /**
   * Fetch 5-day weather forecast by coordinates
   */
  async getForecastByCoords(
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

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      console.error('Error fetching forecast:', error);
      throw new WeatherAPIError('Network error while fetching forecast data');
    }
  },

  /**
   * Get current location weather (combines location + weather services)
   */
  async getCurrentLocationWeather(): Promise<{
    weatherData: WeatherData;
    location: LocationData;
  }> {
    try {
      // Get current location
      const coords = await locationService.getCurrentLocation();
      
      // Fetch weather data
      const weatherData = await weatherService.getWeatherByCoords(
        coords.latitude,
        coords.longitude
      );

      const location: LocationData = {
        name: weatherData.name,
        country: weatherData.sys.country,
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      };

      return { weatherData, location };
    } catch (error) {
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      throw new WeatherAPIError('Failed to get current location weather');
    }
  },
};

// Geocoding API Services
export const geocodingService = {
  /**
   * Search for cities based on query string
   */
  async searchCities(query: string, limit: number = 5): Promise<CitySuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    try {
      const response = await fetch(
        `${GEOCODING_BASE_URL}/direct?q=${encodeURIComponent(
          query
        )}&limit=${limit}&appid=${OPENWEATHER_API_KEY}`
      );

      if (!response.ok) {
        throw new WeatherAPIError('Failed to fetch city suggestions', response.status);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof WeatherAPIError) {
        throw error;
      }
      console.error('Error fetching city suggestions:', error);
      throw new WeatherAPIError('Network error while searching cities');
    }
  },
};

// Combined API service object
export const api = {
  location: locationService,
  weather: weatherService,
  geocoding: geocodingService,
};

export default api;