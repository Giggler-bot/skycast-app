import * as Location from 'expo-location';
import { Linking, Alert } from 'react-native';
import { WeatherAPIError } from '@/service/api';

/**
 * Location service wrappers for requesting permissions and getting coords.
 * - Uses expo-location
 * - Exposes helper to open app settings when permission is denied
 */

export const locationService = {
  /**
   * Request foreground location permission from the user.
   * Returns true if granted, false otherwise.
   */
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      // status can be 'granted' | 'denied' | 'undetermined' depending on platform
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      // don't throw a raw error here — let callers handle the boolean result.
      throw new WeatherAPIError('Failed to request location permission');
    }
  },

  /**
   * Get current device coordinates. This assumes the permission has already been granted.
   * If permission is not granted this will throw a WeatherAPIError.
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new WeatherAPIError('Failed to get current location');
    }
  },

  /**
   * Convenience method: ensure permission then get coords.
   * If permission is denied, it returns null (and does NOT open settings automatically).
   * On success returns { latitude, longitude }.
   */
  async ensurePermissionAndGetCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const granted = await this.requestLocationPermission();
      if (!granted) return null;

      return await this.getCurrentLocation();
    } catch (error) {
      // bubble up known WeatherAPIError, otherwise wrap
      if (error instanceof WeatherAPIError) throw error;
      console.error('Unexpected error in ensurePermissionAndGetCurrentLocation:', error);
      throw new WeatherAPIError('Unable to access location');
    }
  },

  /**
   * Open the app settings so the user can enable location permission manually.
   * Use this when the user has permanently denied permission.
   */
  async openAppSettings(): Promise<void> {
    try {
      // Linking.openSettings is supported on RN 0.59+. Fallback to a simple alert with instructions.
      const opened = await Linking.openSettings();
      // `openSettings()` resolves to true/false on some platforms; we don't need to act on it.
      return opened as unknown as void;
    } catch (err) {
      console.warn('Could not open app settings programmatically.');
      // Show an alert telling the user how to enable permissions manually
      Alert.alert(
        'Enable Location',
        'Please enable location permission for this app in your device settings.',
        [
          { text: 'OK', style: 'default' },
        ]
      );
    }
  },
};

export default locationService;

/*
USAGE NOTES

In your MainDashboard (or wherever you need it):

import { locationService } from '@/service/locationService';

// 1) ask for permission and get coords (recommended flow)
const init = async () => {
  const coords = await locationService.ensurePermissionAndGetCurrentLocation();
  if (!coords) {
    // permission denied — show UI that allows user to "Open Settings"
    // e.g. show a button that calls locationService.openAppSettings()
    return;
  }
  // use coords.latitude and coords.longitude to fetch weather
};

// 2) if you need to prompt user to open settings when permission denied:
// show button that calls locationService.openAppSettings()
*/
