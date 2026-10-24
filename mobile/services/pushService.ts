import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { updateProfile } from './authService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
  }),
});

/**
 * Registers the native FCM device token and stores it on the user doc so the
 * server can push via Firebase Cloud Messaging. Requires a development/production
 * build with google-services.json (not Expo Go).
 */
export async function registerForPush(uid: string): Promise<string | null> {
  try {
    if (!Device.isDevice || Platform.OS !== 'android') return null;
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Orders & updates', importance: Notifications.AndroidImportance.HIGH,
    });
    const perm = await Notifications.requestPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const { data } = await Notifications.getDevicePushTokenAsync();
    await updateProfile(uid, { fcmToken: data });
    return data;
  } catch (e) {
    console.warn('Push registration skipped:', (e as Error).message);
    return null;
  }
}
