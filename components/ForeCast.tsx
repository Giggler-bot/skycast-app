// components/Forecast.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarIcon } from 'react-native-heroicons/outline';

import { images } from '@/constants/images';
import { ForecastData, getForecastByCoords } from '@/service/forecast';
import { Gradient } from '@/utils/gradients';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 120; // used for snapping

interface Location { 
  latitude: number; 
  longitude: number; 
  name?: string; 
}

interface ForecastProps {
  cityName?: string | null; // if provided, fetch by city
  weatherData?: { main?: { temp?: number | null } } | null;
  location?: Location | null; // fallback if no cityName
  onRefresh?: () => Promise<void> | void;
  gradient: Gradient;
}

export default function Forecast({ cityName, weatherData, location, onRefresh, gradient }: ForecastProps) {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const load = useCallback(async () => {
    if (!cityName && !location) {
      setError('No location or city provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch forecast data based on available location info
      let result: ForecastData;
      if (location) {
        result = await getForecastByCoords(location.latitude, location.longitude);
      } else {
        // If you have a getForecastByCity function, use it here
        // result = await getForecastByCity(cityName);
        throw new Error('City-based forecast not implemented');
      }
      
      setForecast(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forecast');
    } finally {
      setLoading(false);
    }
  }, [cityName, location]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      await load();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, load]);

  // Load forecast on mount or when dependencies change
  useEffect(() => {
    load();
  }, [load]);

  const iconUrl = (iconCode: string) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  
  const formatHour = (dt: number) => {
    const d = new Date(dt * 1000);
    const h = d.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${ampm}`;
  };

  const topTemp =
    typeof weatherData?.main?.temp === 'number'
      ? Math.round(weatherData.main.temp)
      : forecast?.hourly?.[0]?.temp ?? null;

  return (
    <View className="flex-1 bg-transparent">
      {/* Background */}
      <Image source={images.bg} 
      className="absolute w-full h-full" 
      resizeMode="cover" />

      {/* Header Temp + City */}
      <View className="items-center py-6">
        <Text className="text-white text-[48px] font-bold text-center">
          {topTemp !== null ? `${topTemp}°C` : '--°C'}
        </Text>
        {forecast?.cityName ? (
          <Text className="text-secondary mt-1 text-lg">{forecast.cityName}</Text>
        ) : cityName ? (
          <Text className="text-white mt-1 text-lg">{cityName}</Text>
        ) : null}
      </View>

      {/* Hourly header */}
      <View className="flex-row justify-between items-center px-5 mb-3">
        <Text className="text-[#3b3b3b] text-base font-semibold">See Hourly Forecast</Text>
        <Text className="text-[#3b3b3b]">⌚</Text>
      </View>

      {/* Hourly carousel - glass container */}
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
        start={[0, 0]}
        end={[1, 1]}
        className="rounded-2xl border border-white/6 mx-4 p-4"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center' }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />}
        >
          {loading && !forecast ? (
            <View className="w-full items-center justify-center py-6">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-white mt-2">Loading forecast...</Text>
            </View>
          ) : error ? (
            <View className="p-4 items-center">
              <Text className="text-red-500 text-center mb-2">{error}</Text>
              <TouchableOpacity onPress={load} className="mt-2 bg-blue-500 px-4 py-2 rounded">
                <Text className="text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : forecast?.hourly && forecast.hourly.length > 0 ? (
            forecast.hourly.map((h) => (
              <View key={h.dt} className="mr-4 rounded-full">
                  <LinearGradient
                  colors={['#FFD6E8', '#FFB3D6']}
                  start={[0, 0]}
                  end={[1, 1]}
                  className="w-[120px] h-[170px] rounded-full items-center justify-between py-4 px-3 shadow-lg"
                >
                  <Text className="text-[#5b2b4a] font-extrabold text-sm">
                    {formatHour(h.dt).toUpperCase()}
                  </Text>

                  <Image 
                    source={{ uri: iconUrl(h.icon) }} 
                    className="w-[56px] h-[56px]" 
                    resizeMode="contain" 
                  />

                  <Text className="text-[#5b2b4a] font-extrabold text-lg">{h.temp}°</Text>
                </LinearGradient>
                
                <View className="-mt-3 self-center w-[102px] h-2 rounded-full bg-[#5b2b4a]/6" />
              </View>
            ))
          ) : (
            <View className="w-full items-center justify-center py-6">
              <Text className="text-white">No hourly forecast available</Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Daily header */}
      <View className="flex-row justify-between items-center px-5 mb-3 mt-8">
        <Text className="text-base text-[#3b3b3b] font-semibold">Daily Forecast</Text>
        <CalendarIcon color="black" size={20} />
      </View>

      {/* Daily list */}
      <View className="flex-col px-5 space-y-3 mt-2">
        {loading && !forecast ? (
          <View className="items-center py-4">
            <ActivityIndicator size="large" />
            <Text className="text-gray-600 mt-2">Loading daily forecast...</Text>
          </View>
        ) : error ? (
          <View className="p-4 items-center">
            <Text className="text-red-500 text-center">Could not load daily forecast.</Text>
            <TouchableOpacity onPress={load} className="mt-2 bg-blue-500 px-4 py-2 rounded">
              <Text className="text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : forecast?.daily && forecast.daily.length > 0 ? (
          forecast.daily.map((d) => (
            <View key={d.date} className="flex-row items-center justify-between rounded-xl p-3 bg-forecastBG">
              <View className="flex-row items-center space-x-3">
                <Text className="text-secondary w-16">
                  {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                </Text>
                <Image 
                  source={{ uri: iconUrl(d.icon) }} 
                  className="w-[44px] h-[44px]" 
                  resizeMode="contain"
                />
                <View>
                  <Text className="text-secondary">{d.description}</Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-secondary">{d.tempMax}°</Text>
                <Text className="text-secondary text-sm">{d.tempMin}°</Text>
              </View>
            </View>
          ))
        ) : (
          <View className="items-center py-4">
            <Text className="text-gray-600">No daily forecast available</Text>
          </View>
        )}
      </View>
    </View>
  );
}