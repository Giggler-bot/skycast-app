import OutfitRecommendation from '@/components/OutfitCard';
import SearchBar from '@/components/SearchBar'; // Import the new SearchBar component
import WeatherCard from '@/components/WeatherCard';
import { images } from '@/constants/images';
import '@/global.css';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import API services
import {
  api,
  LocationData,
  WeatherAPIError,
  WeatherData,
} from '@/service/api';
import { gradients } from '@/utils/gradients';
import locationService from '@/service/api.location';

export default function MainDashboard() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  /**
   * Initialize location permissions
   */
  const initializeLocation = useCallback(async () => {
    try {
      const hasPermission = await api.location.requestLocationPermission();
      setHasLocationPermission(hasPermission);
      
      if (!hasPermission) {
        setError('Location permission denied. Please search for a city manually.');
      } else {
        setError(null);
        await getCurrentLocationWeather();
      }
    } catch (error) {
      console.error('Error initializing location:', error);
      setError('Failed to request location permission.');
    }
  }, []);

  // Request location permission on component mount
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Get user's current location weather data
  useEffect(() => {
    if (hasLocationPermission && !weatherData) {
      getCurrentLocationWeather();
    }
  }, [hasLocationPermission, weatherData]);

  /**
   * Get weather data for current user location
   */
  const getCurrentLocationWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.weather.getCurrentLocationWeather();
        setLocation(result.location ?? {
          name: result.weatherData?.name ?? 'Current Location',
          country: result.weatherData?.sys?.country ?? '',
          coords: {
            latitude: result.weatherData?.coord?.lat ?? 0,
            longitude: result.weatherData?.coord?.lon ?? 0,
          },
        });
    } catch (error) {
        console.error('Error getting current location weather:', error);
        if (error instanceof WeatherAPIError) {
        setError(error.message);
      } else {
        setError('Failed to get current location weather. Try searching for a city.');
      }
    } finally {
      setLoading(false);
    }
  };

  

  /**
   * Handle weather data from SearchBar component
   */
  const handleWeatherData = (weatherData: WeatherData, location: LocationData) => {
    setWeatherData(weatherData);
    setLocation(location);
    setError(null); // Clear any existing errors
  };

  /**
   * Handle loading state from SearchBar component
   */
  const handleLoading = (loading: boolean) => {
    setLoading(loading);
  };

  /**
   * Handle error state from SearchBar component
   */
  const handleError = (error: string | null) => {
    setError(error);
  };

  /**
   * Refresh weather data
   */
  const refreshWeatherData = async () => {
    if (location) {
      // If we have a location, refresh its weather
      if (hasLocationPermission && location.name === weatherData?.name) {
        // Current location
        await getCurrentLocationWeather();
      } else {
        // Searched city - we can use the SearchBar's searchCityWeather method
        // For now, we'll just reload current location weather if available
        if (hasLocationPermission) {
          await getCurrentLocationWeather();
        }
      }
    } else if (hasLocationPermission) {
      // Try to get current location weather
      await getCurrentLocationWeather();
    }
  };

  /**
   * Get outfit recommendation based on temperature and weather condition
   */
  const getOutfitRecommendation = (temp: number, weatherCondition: string) => {
    // Consider weather condition for recommendations
    const isRaining = ['Rain', 'Drizzle', 'Thunderstorm'].includes(weatherCondition);
    const isSnowing = weatherCondition === 'Snow';

    if (temp >= 25) {
      return {
        type: 'Light clothing',
        items: isRaining 
          ? ['Light T-shirt', 'Shorts', 'Sandals', 'Umbrella'] 
          : ['T-shirt', 'Shorts', 'Sandals'],
        icon: '👕'
      };
    } else if (temp >= 15) {
      return {
        type: 'Light sweater',
        items: isRaining 
          ? ['Light sweater', 'Jeans', 'Sneakers', 'Light jacket'] 
          : ['Light sweater', 'Jeans', 'Sneakers'],
        icon: '🧥'
      };
    } else if (temp >= 5) {
      return {
        type: 'Warm clothing',
        items: isRaining || isSnowing
          ? ['Warm jacket', 'Long pants', 'Waterproof shoes', 'Umbrella']
          : ['Jacket', 'Long pants', 'Closed shoes'],
        icon: '🧥'
      };
    } else {
      return {
        type: 'Heavy clothing',
        items: isSnowing
          ? ['Heavy winter coat', 'Warm layers', 'Winter boots', 'Gloves', 'Hat']
          : ['Heavy coat', 'Warm layers', 'Boots'],
        icon: '🧥'
      };
    }
  };

  return (
    <ImageBackground
      source={images.bg}
      resizeMode="cover"
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 px-4 pt-4">
          {/* Search Bar Component */}
          <SearchBar
            onWeatherData={handleWeatherData}
            onLoading={handleLoading}
            onError={handleError}
          />

          {/* Loading Indicator */}
          {loading && (
            <View className="flex-1 justify-center items-center py-20">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white mt-2">Loading weather data...</Text>
            </View>
          )}

          {/* Error Message */}
          {error && !loading && !weatherData && (
            <View className="bg-red-500/80 p-4 rounded-lg mb-4">
              <Text className="text-white text-center">{error}</Text>
              <TouchableOpacity
                className="mt-2 bg-white/20 p-2 rounded-lg"
                onPress={() => {
                  // Clear error and try to initialize location again
                  setError(null);
                  initializeLocation();
                }}
              >
                <Text className="text-white text-center">Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Weather Card - Only show if we have weather data */}
          {weatherData && location && !loading && (
            <>
              <WeatherCard
                weatherData={weatherData}
                location={location}
                onRefresh={refreshWeatherData}
                gradient={gradients.welcome}
              />

              {/* Outfit Recommendation - Only show if we have weather data */}
              <OutfitRecommendation
                temperature={Math.round(weatherData.main.temp)}
                weatherCondition={weatherData.weather[0].main}
                recommendation={getOutfitRecommendation(
                  weatherData.main.temp,
                  weatherData.weather[0].main
                )}
              />

              {/* View Forecast Button */}
              <TouchableOpacity
                className="bg-pink-400/80 p-4 rounded-full mt-6 mb-0"
                onPress={() => router.push({
                  pathname: '/ForeCast',
                  params: {
                    lat: location.coords.latitude,
                    lon: location.coords.longitude,
                    city: location.name
                  }
                })}
              >
                <Text className="text-white text-center text-lg font-semibold">
                  View Forecast
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* No Data Message */}
          {!weatherData && !loading && !error && (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-white text-xl text-center mb-4">
                Welcome to Weather App! 🌤️
              </Text>
              <Text className="text-white/80 text-center mb-6 px-4">
                Allow location access or search for a city to get started.
              </Text>
              <Text className="text-white text-center font-semibold">
                Use the search bar above to find a city
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Back Button */}
        <TouchableOpacity
          className="absolute top-12 left-5 bg-black/50 p-3 rounded-full"
          onPress={() => router.back()}
        >
          <Image 
            source={images.arrow} 
            className="w-5 h-5" 
            style={{ 
              tintColor: '#fff',
              transform: [{ rotate: '180deg' }]
            }} 
          />
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}