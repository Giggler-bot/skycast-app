// screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import Forecast from '@/components/ForeCast';
import { gradients } from '@/utils/gradients';
import { WeatherData } from '@/service/api';

export default function ForecastScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErr('Location permission denied');
          setLoading(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to get location');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
        <Text>Getting location…</Text>
      </View>
    );
  }

  if (err) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>{err}</Text>
      </View>
    );
  }

  return (
    <Forecast
      weatherData={weatherData!} // or pass existing weatherData
      location={location!} // we know it's not null here
      gradient={gradients.welcome}
    />
  );
}

