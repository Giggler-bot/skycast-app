import React from 'react';
import { View, Text, ScrollView, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { images } from '@/constants/images';
import { useRouter } from 'expo-router';  

export default function ForeCast() {
  const router = useRouter();

  return (
    <ImageBackground
      source={images.bg}
      resizeMode="cover"
      className="flex-1 p-4"
    >
     

        {/* Back Button */}
      <TouchableOpacity
        className="absolute top-10 left-5 bg-black/50 p-3 rounded-full"
        onPress={router.back}
      >
        <Image source={images.arrow} className="size-5 rotate-180" style={{ tintColor: '#fff' }} />
      </TouchableOpacity>
    </ImageBackground>
  );
}
