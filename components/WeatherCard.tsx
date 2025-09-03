import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Text, View } from 'react-native';
import { WeatherData } from '../service/api';
import { Gradient, gradients } from '@/utils/gradients';
import { images } from '@/constants/images';

interface Location {
  name: string;
  country: string;
}

interface WeatherCardProps {
  weatherData: WeatherData;
  location: Location;
  onRefresh?: () => Promise<void> | void;
  gradient: Gradient;
}

export default function WeatherCard({ weatherData, location, onRefresh, gradient }: WeatherCardProps) {
  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <>
      <View className='items-center justify-center'>
          <Image 
          source={images.Bg}
          className="mt-2 mb-0 "
          resizeMode='cover'
          style={{ 
            width: 200, height: 200, resizeMode: 'cover', borderRadius: 0,
          }}
        />
      </View>
      <View className='mb-5'>
        <LinearGradient
          colors={gradients.welcome.colors}
          locations={gradients.welcome.locations}
          start={gradients.welcome.start}
          end={gradients.welcome.end}
          className="flex-1 items-center justify-center"
        >
          <View className=" backdrop-blur-md  p-6 ">
            <Text className="text-dark font-bold text-2xl mb-2">
              {formatDate()}
            </Text>
            
            <View className="flex-row mb-4">
              <Image 
                source={{ uri: 'https://via.placeholder.com/60x60' }} 
                className="w-15 h-15 mr-3"
              />
              <View>
                <Text className="text-secondary text-md">
                  📍 {location.name}, {location.country}
                </Text>
                <Text className="text-secondary text-sm">
                  {weatherData.weather[0].description}
                </Text>
              </View>
            </View>

            <View className="">
              <Text className="text-white text-6xl font-bold mb-2 text-center">
                {Math.round(weatherData.main.temp)}°c
              </Text>
              <View className='mb-0 flex justify-end'>
                <Text className="text-secondary">
                  Feels like {Math.round(weatherData.main.feels_like)}°
                </Text>
                <Text className="text-secondary">
                  💧 {weatherData.main.humidity}%
                </Text>
              </View>
            
            </View>
          </View>
        </LinearGradient>
      </View>
    </>
   
  );
}