import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, View } from 'react-native';

import {
  OrderTrackingMapFallback,
  type OrderTrackingMapProps,
} from '@/components/order-tracking-map-fallback';
import { hasNativeMapsModule } from '@/lib/canUseNativeMaps';

export type { OrderTrackingMapProps };

/**
 * Loads react-native-maps only in dev/production builds where RNMapsAirModule exists.
 * Expo Go never imports the native maps chunk (avoids TurboModule crash).
 */
export function OrderTrackingMap(props: OrderTrackingMapProps) {
  const [NativeMap, setNativeMap] = useState<ComponentType<OrderTrackingMapProps> | null>(null);
  const [failed, setFailed] = useState(!hasNativeMapsModule());

  useEffect(() => {
    if (!hasNativeMapsModule()) {
      setFailed(true);
      return;
    }

    let cancelled = false;
    import('@/components/order-tracking-map-native')
      .then((mod) => {
        if (!cancelled) setNativeMap(() => mod.OrderTrackingMapNative);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return <OrderTrackingMapFallback {...props} />;
  }

  if (!NativeMap) {
    return (
      <View style={{ height: props.height ?? 280, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <NativeMap {...props} />;
}
