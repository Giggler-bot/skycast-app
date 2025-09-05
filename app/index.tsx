import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { images } from '@/constants/images';
import '@/global.css';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-">
      {/* <StatusBar barStyle="light-content" backgroundColor="transparent" translucent /> */}

      {/* Background Image */}
      <ImageBackground
        source={images.bg}
        resizeMode="cover"
        className="flex-1 w-full absolute z-0 h-full"
      >
        {/* Main content */}
        <View className="flex-1 justify-center items-center px-6">
          <View className="relative items-center justify-center mb-1">
            <Image
              source={images.cloudBg}
              className="w-50 h-60"
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <View className="items-center mb-20 mt-1">
            <Text className="text-white text-5xl font-normal mb-1">Weather</Text>
            <Text className="text-primary text-5xl font-black">ForeCasts</Text>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            className="rounded-full"
            style={{
              shadowColor: '#ff4757',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 25,
              elevation: 8,
            }}
            onPress={() => router.push('/MainDashBoard')}
            activeOpacity={0.8}
          >
            <View className='rounded-xl'>
              <LinearGradient
                colors={['#ff8a95', '#ff6b8a', '#ff4757']}
                className="px-12 py-6 rounded-full"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
              
                  <Text className="text-black text-2xl font-semibold p-5 ">Get Started</Text>
                
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}
