import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { refreshAccessToken } from '@/lib/tokenRefresh';
import { getAccessToken, getRefreshToken } from '@/lib/storage';
import { useTheme } from '@/hooks/use-theme';

export default function Index() {
  const theme = useTheme();
  const [target, setTarget] = useState<'auth' | 'tabs' | null>(null);

  useEffect(() => {
    let alive = true;

    const fallback = setTimeout(() => {
      if (alive) setTarget('auth');
    }, 6000);

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
        setTarget(token ? 'tabs' : 'auth');
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  return <Redirect href={target === 'tabs' ? '/(tabs)' : '/(auth)'} />;
}
