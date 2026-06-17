import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { refreshAccessToken } from '@/lib/tokenRefresh';
import { registerForPushNotifications } from '@/lib/pushNotifications';
import { getAccessToken, getRefreshToken } from '@/lib/storage';

const BOOT_TIMEOUT_MS = 5000;
const LOADING_ORANGE = '#ff5a00';

export default function Index() {
  const [target, setTarget] = useState<'auth' | 'tabs' | null>(null);

  useEffect(() => {
    let alive = true;

    const fallback = setTimeout(() => {
      if (alive) setTarget('auth');
    }, BOOT_TIMEOUT_MS);

    (async () => {
      try {
        let token = await getAccessToken();
        if (!token) {
          const refresh = await getRefreshToken();
          if (refresh) {
            token = await refreshAccessToken();
          }
        }
        if (!alive) return;
        clearTimeout(fallback);
        if (token) {
          void registerForPushNotifications();
          setTarget('tabs');
        } else {
          setTarget('auth');
        }
      } catch {
        if (!alive) return;
        clearTimeout(fallback);
        setTarget('auth');
      }
    })();

    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, []);

  if (!target) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LOADING_ORANGE }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Redirect href={target === 'tabs' ? '/(tabs)' : '/(auth)'} />;
}
