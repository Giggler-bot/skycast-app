import OutfitRecommendation from '@/components/OutfitCard';
import WeatherCard from '@/components/WeatherCard';
import SearchBar from '@/components/SearchBar';
import { images } from '@/constants/images';
import '@/global.css';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import {gradients} from '@/utils/gradients';
import {locationService} from '@/service/api.location';

/**
 * MainDashboard (patched to use locationService.ensurePermissionAndGetCurrentLocation())
 * - Requests permission and opens app settings when needed
 * - Clears stale errors when data successfully loads
 * - Ensures weatherData is set whenever location is available
 */

export default function MainDashboard() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  useEffect(() => {
    initializeLocationFlow();
  }, []);

  /**
   * Combined init flow — ask permission and fetch weather if available
   */
  const initializeLocationFlow = async () => {
    setLoading(true);
    try {
      const coords = await locationService.ensurePermissionAndGetCurrentLocation();

      if (!coords) {
        // Permission denied or user dismissed prompt
        setHasLocationPermission(false);
        setError('Location permission denied. Please search for a city manually.');
        setLoading(false);
        return;
      }

      // We have coords and permission
      setHasLocationPermission(true);
      setError(null);

      // Fetch weather by coordinates — prefer an API method that accepts coords
      try {
        const weather = await api.weather.getWeatherByCoords(coords.latitude, coords.longitude);

        // Ensure we set both weatherData and location so UI states clear correctly
        setWeatherData(weather);
        setLocation({
          name: weather.name,
          country: weather.sys?.country ?? '',
          coords: {
            latitude: weather.coord.lat,
            longitude: weather.coord.lon,
          },
        });

        setError(null);
      } catch (err) {
        console.error('Failed to fetch weather by coords after permission granted:', err);
        if (err instanceof WeatherAPIError) {
          setError(err.message);
        } else {
          setError('Failed to fetch weather for your location. Please try searching manually.');
        }
      }
    } catch (err) {
      console.error('Unexpected error initializing location flow:', err);
      setError('An unexpected error occurred while accessing location.');
      setHasLocationPermission(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handler called by SearchBar when user searches for a city
   */
  const handleWeatherData = (weatherData: WeatherData, location: LocationData) => {
    setWeatherData(weatherData);
    setLocation(location);
    setError(null);
  };

  const handleLoading = (isLoading: boolean) => setLoading(isLoading);
  const handleError = (err: string | null) => setError(err);

  const refreshWeatherData = async () => {
    if (location) {
      setLoading(true);
      try {
        // If the current shown location corresponds to device location and we have permission, refresh by coords
        if (hasLocationPermission && location.coords) {
          const weather = await api.weather.getWeatherByCoords(location.coords.latitude, location.coords.longitude);
          setWeatherData(weather);
          setError(null);
        } else {
          // Otherwise, attempt to fetch by city name
          const weather = await api.weather.getWeatherByCity(location.name);
          setWeatherData(weather);
          setError(null);
        }
      } catch (err) {
        console.error('Error refreshing weather data:', err);
        setError('Failed to refresh weather data.');
      } finally {
        setLoading(false);
      }
    } else if (hasLocationPermission) {
      // Try to re-run the init flow
      await initializeLocationFlow();
    } else {
      setError('No location available. Please search for a city.');
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
          <SearchBar
            onWeatherData={handleWeatherData}
            onLoading={handleLoading}
            onError={handleError}
          />

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

              {/* If permission was denied, show a button to open app settings */}
              {hasLocationPermission === false && (
                <TouchableOpacity
                  className="mt-2 bg-white/20 p-2 rounded-lg"
                  onPress={async () => {
                    // Offer to open app settings so the user can enable permission
                    await locationService.openAppSettings();
                    // Re-run initialization which will check permission again
                    initializeLocationFlow();
                  }}
                >
                  <Text className="text-white text-center">Allow location access</Text>
                </TouchableOpacity>
              )}

              {/* Try again generic button (re-init flow) */}
              <TouchableOpacity
                className="mt-2 bg-white/20 p-2 rounded-lg"
                onPress={() => {
                  setError(null);
                  initializeLocationFlow();
                }}
              >
                <Text className="text-white text-center">Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {weatherData && location && !loading && (
            <>
              <WeatherCard
                weatherData={weatherData}
                location={location}
                onRefresh={refreshWeatherData}
                gradient={gradients.welcome}
              />

              <OutfitRecommendation
                temperature={Math.round(weatherData.main.temp)}
                weatherCondition={weatherData.weather[0].main}
                recommendation={
                  ((): any => {
                    const temp = weatherData.main.temp;
                    const weatherCondition = weatherData.weather[0].main;
                    const isRaining = ['Rain', 'Drizzle', 'Thunderstorm'].includes(weatherCondition);
                    const isSnowing = weatherCondition === 'Snow';

                    if (temp >= 25) {
                      return {
                        type: 'Light clothing',
                        items: isRaining
                          ? ['Light T-shirt', 'Shorts', 'Sandals', 'Umbrella']
                          : ['T-shirt', 'Shorts', 'Sandals'],
                        icon: '👕',
                      };
                    } else if (temp >= 15) {
                      return {
                        type: 'Light sweater',
                        items: isRaining
                          ? ['Light sweater', 'Jeans', 'Sneakers', 'Light jacket']
                          : ['Light sweater', 'Jeans', 'Sneakers'],
                        icon: '🧥',
                      };
                    } else if (temp >= 5) {
                      return {
                        type: 'Warm clothing',
                        items: isRaining || isSnowing
                          ? ['Warm jacket', 'Long pants', 'Waterproof shoes', 'Umbrella']
                          : ['Jacket', 'Long pants', 'Closed shoes'],
                        icon: '🧥',
                      };
                    } else {
                      return {
                        type: 'Heavy clothing',
                        items: isSnowing
                          ? ['Heavy winter coat', 'Warm layers', 'Winter boots', 'Gloves', 'Hat']
                          : ['Heavy coat', 'Warm layers', 'Boots'],
                        icon: '🧥',
                      };
                    }
                  })()
                }
              />

              <TouchableOpacity
                className="bg-pink-400/80 p-4 rounded-full mt-6 mb-0"
                onPress={() =>
                  router.push({
                    pathname: '/ForeCast',
                    params: {
                      lat: location.coords.latitude,
                      lon: location.coords.longitude,
                      city: location.name,
                    },
                  })
                }
              >
                <Text className="text-white text-center text-lg font-semibold mb-4">View Forecast</Text>
              </TouchableOpacity>
            </>
          )}

          {!weatherData && !loading && !error && (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-white text-xl text-center mb-4">Welcome to Weather App! 🌤️</Text>
              <Text className="text-white/80 text-center mb-6 px-4">Allow location access or search for a city to get started.</Text>
              <Text className="text-white text-center font-semibold">Use the search bar above to find a city</Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          className="absolute top-12 left-5 bg-black/50 p-3 rounded-full"
          onPress={() => router.back()}
        >
          <Image
            source={images.arrow}
            className="w-5 h-5"
            style={{
              tintColor: '#fff',
              transform: [{ rotate: '180deg' }],
            }}
          />
        </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}