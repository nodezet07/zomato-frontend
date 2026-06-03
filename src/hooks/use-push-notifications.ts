import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { registerDeviceToken } from '@/services/notifications';
import { getAccessToken } from '@/lib/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function resolveExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  useEffect(() => {
    let sub: Notifications.Subscription | undefined;

    (async () => {
      const access = await getAccessToken();
      if (!access) return;

      const token = await resolveExpoPushToken();
      if (token) {
        try {
          await registerDeviceToken({
            token,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
          });
        } catch {
          // non-fatal
        }
      }

      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const orderId = response.notification.request.content.data?.orderId as string | undefined;
        if (orderId) {
          // Deep link handled by expo-router if path configured; data available for future use
        }
      });
    })();

    return () => sub?.remove();
  }, []);
}
