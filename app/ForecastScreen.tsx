// screens/ForecastScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import * as Location from 'expo-location';
import Forecast from "@/components/ForeCast";
import { gradients } from '@/utils/gradients';
import { WeatherData } from '@/service/api';
import { images } from '@/constants/images';
import { useRouter } from 'expo-router';

export default function ForecastScreen() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const router = useRouter();

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

  // NOTE: pass weatherData as-is (may be null). Forecast component handles null safely.
  return (
    <>
      <Forecast
        weatherData={weatherData}
        location={location!}
        gradient={gradients.welcome}
      />
      <TouchableOpacity
          className="absolute top-5 left-0 bg-black/50 p-3 rounded-full"
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
    </>

  );
}
