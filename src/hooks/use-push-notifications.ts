import { useEffect } from 'react';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Constants from 'expo-constants';

import { registerDeviceToken } from '@/services/notifications';
import { getAccessToken } from '@/lib/storage';

type NotificationsModule = typeof import('expo-notifications');
type DeviceModule = typeof import('expo-device');

async function getNotifications(): Promise<NotificationsModule | null> {
  if (requireOptionalNativeModule('ExpoNotifications') == null) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

async function getDevice(): Promise<DeviceModule | null> {
  if (requireOptionalNativeModule('ExpoDevice') == null) return null;
  try {
    return await import('expo-device');
  } catch {
    return null;
  }
}

async function resolveExpoPushToken(
  Notifications: NotificationsModule,
  Device: DeviceModule,
): Promise<string | null> {
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
    let sub: { remove: () => void } | undefined;

    (async () => {
      const Notifications = await getNotifications();
      const Device = await getDevice();
      if (!Notifications || !Device) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const access = await getAccessToken();
      if (!access) return;

      const token = await resolveExpoPushToken(Notifications, Device);
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

      sub = Notifications.addNotificationResponseReceivedListener(() => {
        // Deep link data available for future use
      });
    })();

    return () => sub?.remove();
  }, []);
}
