// components/Forecast.tsx
import { images } from '@/constants/images'; // adapt path
import { WeatherData } from '@/service/api';
import { ForecastData, getForecastByCoords } from '@/service/forecast';
import { Gradient } from '@/utils/gradients'; // adapt path
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarIcon } from 'react-native-heroicons/outline';

interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

interface ForeCastProps {
  weatherData: WeatherData  // keep your old shape for top temp display
  location: Location;
  onRefresh?: () => Promise<void> | void;
  gradient: Gradient;
}

export default function ForeCast({ weatherData, location, onRefresh, gradient }: ForeCastProps) {

  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getForecastByCoords(location.latitude, location.longitude);
      setForecast(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load forecast');
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    load();
  }, [load]);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
      if (onRefresh) await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [load, onRefresh]);

  const iconUrl = (iconCode: string) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  const formatHour = (dt: number) => {
    const d = new Date(dt * 1000);
    const h = d.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${ampm}`;
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short' }); // e.g., Mon
  };

  return (
    <View className="flex-1">
      <Image source={images.bg} className="absolute w-full" resizeMode="cover" />

      <View className="items-center py-6">
        <Text className="text-white text-6xl font-bold text-center">
          {Math.round(weatherData.main.temp)}°c
        </Text>
        {forecast && (
          <Text className="text-white mt-1 text-lg">{forecast.cityName}</Text>
        )}
      </View>

      <View className="flex-row justify-between items-center px-5 mb-3">
        <Text className="text-base">See Hourly Forecast</Text>
        <Text className="text-base">⌚</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} />}
      >
        <LinearGradient
          colors={gradient.colors}
          locations={gradient.locations}
          start={gradient.start}
          end={gradient.end}
          className="flex-row items-center rounded-2xl p-4 space-x-4"
        >
          {loading && !forecast ? (
            <ActivityIndicator size="small" />
          ) : error ? (
            <View className="p-4">
              <Text className="text-red-500">Error: {error}</Text>
              <TouchableOpacity onPress={load} className="mt-2">
                <Text className="text-blue-500">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (forecast?.hourly ?? []).map((h) => (
              <View
                key={h.dt}
                className="items-center justify-center w-24 rounded-xl py-3 px-2 bg-forecastBG"
              >
                <Text className="text-secondary">{formatHour(h.dt)}</Text>

                {/* icon (openweather) */}
                <Image
                  source={{ uri: iconUrl(h.icon) }}
                  style={{ width: 44, height: 44 }}
                  className="my-1"
                />

                <Text className="text-secondary">{h.temp}°</Text>
              </View>
            ))
          )}
        </LinearGradient>
      </ScrollView>

      {/* Daily forecast header */}
      <View className="flex-row justify-between items-center px-5 mb-3 mt-4">
        <Text className="text-base">Daily Forecast</Text>
        <CalendarIcon color="black" size={20} />
      </View>

      <View className="flex-col px-5 space-y-3 mt-2">
        {loading && !forecast ? (
          <ActivityIndicator />
        ) : error ? (
          <View className="p-4">
            <Text className="text-red-500">Could not load daily forecast.</Text>
            <TouchableOpacity onPress={load} className="mt-2">
              <Text className="text-blue-500">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          (forecast?.daily ?? []).map((d) => (
            <View
              key={d.date}
              className="flex-row items-center justify-between rounded-xl p-3 bg-forecastBG"
            >
              <View className="flex-row items-center space-x-3">
                <Text className="text-secondary w-16">{formatDay(d.date)}</Text>
                <Image source={{ uri: iconUrl(d.icon) }} style={{ width: 44, height: 44 }} />
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
        )}
      </View>
    </View>
  );
}
