import { images } from '@/constants/images';
import { api, CitySuggestion, LocationData, WeatherAPIError, WeatherData } from '@/service/api';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchBarProps {
  onWeatherData: (weatherData: WeatherData, location: LocationData) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onWeatherData, 
  onLoading, 
  onError 
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null); // Add coords state
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  /**
   * Search for weather data by city name
   */
  const searchCityWeather = async (cityNameOrCoords: string) => {
    if (!cityNameOrCoords.trim() && !coords) return;

    try {
      onLoading(true);
      onError(null);

      let weatherData: WeatherData;

      if (coords) {
    // If coordinates provided, call the coordinate-based API (if available)
    weatherData = await api.weather.getWeatherByCoords(coords.lat, coords.lon);
    } else {
    weatherData = await api.weather.getWeatherByCity(cityNameOrCoords);
    }
      const locationData: LocationData = {
        name: weatherData.name,
        country: weatherData.sys.country,
        coords: {
          latitude: weatherData.coord.lat,
          longitude: weatherData.coord.lon,
        },
      };

      onWeatherData(weatherData, locationData);
      onError(null);
      setSearchQuery('');
      setShowSearch(false);
      setSuggestions([]);
    } catch (error) {
      if (__DEV__) {
        console.error('Error searching city weather:', error);
      }
      
      if (error instanceof WeatherAPIError) {
        onError(error.message);
        Alert.alert('Error', error.message);
      } else {
        const errorMessage = 'Failed to fetch weather data. Please try again.';
        onError(errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } finally {
      onLoading(false);
    }
  };

  /**
   * Fetch city suggestions for search autocomplete
   */
  const fetchCitySuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestions = await api.geocoding.searchCities(query, 5);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching city suggestions:', error);
      // Don't show error for suggestions, just clear them
      setSuggestions([]);
    }
  }, [setSuggestions]);

  /**
   * Handle search input change with debouncing
   */
  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout for debouncing
    debounceTimeoutRef.current = setTimeout(() => {
      fetchCitySuggestions(text);
    }, 300);
  }, [fetchCitySuggestions]);

  /**
   * Handle suggestion selection
   */
  const handleSuggestionPress = (suggestion: CitySuggestion) => {
    // Prefer using coordinates if available, otherwise use name, state, and country
    if (suggestion.lat !== undefined && suggestion.lon !== undefined) {
      searchCityWeather(`${suggestion.name},${suggestion.state ? suggestion.state + ',' : ''}${suggestion.country}`);
    } else {
      searchCityWeather(`${suggestion.name},${suggestion.state ? suggestion.state + ',' : ''}${suggestion.country}`);
    }
  };

  /**
   * Toggle search bar visibility
   */
  const toggleSearch = () => {
    const willShow = !showSearch;
    setShowSearch(willShow);
    if (!willShow) {
      setSearchQuery('');
      setSuggestions([]);
      // Clear debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }
  };

  /**
   * Handle search submission
   */
  const handleSubmitSearch = () => {
    if (searchQuery.trim()) {
      searchCityWeather(searchQuery.trim());
    }
  };

  return (
    <View className="relative z-50 mb-6">
      {/* Search Input Container */}
      <View className="flex-row items-center bg-white/80 p-3 rounded-full">
        {showSearch && (
          <TextInput
            placeholder="Search for city..."
            returnKeyType="search"
            clearButtonMode="while-editing"
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSubmitSearch}
            autoFocus={true}
            style={{ flex: 1 }}
          />
        )}
        
        <TouchableOpacity onPress={toggleSearch} activeOpacity={0.7}>
          <Image
            source={images.magGlass}
            className="w-6 h-6"
            style={{ tintColor: '#888' }}
          />
        </TouchableOpacity>
      </View> 

      {/* Search Suggestions Dropdown */}
      {suggestions.length > 0 && showSearch && (
        <View className="absolute top-16 left-0 right-0 bg-white rounded-lg shadow-lg z-50 max-h-60">
          {suggestions.map((suggestion: CitySuggestion, index: number) => (
            <TouchableOpacity
              key={suggestion.id ?? `${suggestion.name}-${suggestion.country}-${index}`}
              className="p-3 border-b border-gray-100 last:border-b-0"
              onPress={() => handleSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <Text className="text-gray-800 font-medium">
                {suggestion.name}
              </Text>
              <Text className="text-gray-500 text-sm">
                {suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default SearchBar;