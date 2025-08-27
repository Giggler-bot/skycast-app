import React from 'react';
import { Text, View } from 'react-native';

interface OutfitRecommendationProps {
  temperature: number;
  weatherCondition: string;
  recommendation: {
    type: string;
    items: string[];
    icon: string;
  };
}

export default function OutfitRecommendation({ temperature, weatherCondition, recommendation }: OutfitRecommendationProps) {
  return (
    <View className="bg-white/20 backdrop-blur-md rounded-3xl p-6 mb-6">
      <Text className="text-dark text-lg font-bold mb-4">
        Outfit Recommended
      </Text>
      
      <View className="flex-row items-center">
        <View className="bg-red-500 rounded-2xl p-4 mr-4">
          <Text className="text-secondary text-2xl">{recommendation.icon}</Text>
        </View>
        
        <View className="flex-1">
          <Text className="text-secondary font-semibold text-base mb-1">
            {recommendation.type}
          </Text>
          <Text className="text-secondary text-sm">
            {recommendation.items.join(' • ')}
          </Text>
        </View>
      </View>
    </View>
  );
}