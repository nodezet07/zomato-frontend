import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { refreshAccessToken } from '@/lib/tokenRefresh';
import { getAccessToken, getRefreshToken } from '@/lib/storage';

export default function Index() {
  const [target, setTarget] = useState<'auth' | 'tabs' | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let token = await getAccessToken();
      if (!token) {
        const refresh = await getRefreshToken();
        if (refresh) {
          token = await refreshAccessToken();
        }
      }
      if (!alive) return;
      setTarget(token ? 'tabs' : 'auth');
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!target) return null;
  return <Redirect href={target === 'tabs' ? '/(tabs)' : '/(auth)'} />;
}
