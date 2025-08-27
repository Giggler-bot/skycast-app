// components/HourlyList.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

type Hour = { dt: number; temp: number; weather: { main: string }[] };

export default function HourlyList({ hourly }: { hourly: Hour[] }) {
  const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
  const items = (hourly || []).filter(h => new Date(h.dt * 1000) < midnight);

  return (
    <View className="mt-2">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
        {items.map((h, idx) => {
          const t = new Date(h.dt * 1000).toLocaleTimeString([], { hour: 'numeric' });
          return (
            <View key={idx} className="w-18 h-28 bg-white rounded-xl mr-3 items-center justify-center px-2">
              <Text className="text-xs text-slate-700">{t}</Text>
              <Text className="text-2xl my-1">{emoji(h.weather?.[0]?.main)}</Text>
              <Text className="font-bold">{Math.round(h.temp)}°</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function emoji(main?: string) {
  const m = (main || '').toLowerCase();
  if (m.includes('cloud')) return '☁️';
  if (m.includes('rain') || m.includes('drizzle')) return '🌧️';
  if (m.includes('thunder')) return '⛈️';
  if (m.includes('snow')) return '❄️';
  if (m.includes('mist') || m.includes('fog')) return '🌫️';
  return '☀️';
}