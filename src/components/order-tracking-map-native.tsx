import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import type { OrderTrackingMapProps } from '@/components/order-tracking-map-fallback';

type LatLng = { latitude: number; longitude: number };

function isValidCoord(c?: LatLng | null): c is LatLng {
  return (
    !!c &&
    Number.isFinite(c.latitude) &&
    Number.isFinite(c.longitude) &&
    !(c.latitude === 0 && c.longitude === 0)
  );
}

export function OrderTrackingMapNative({
  customer,
  restaurant,
  rider,
  height = 280,
}: OrderTrackingMapProps) {
  const mapRef = useRef<MapView>(null);

  const points = useMemo(() => {
    const list: { latitude: number; longitude: number }[] = [];
    if (isValidCoord(restaurant)) list.push(restaurant);
    if (isValidCoord(rider)) list.push(rider);
    if (isValidCoord(customer)) list.push(customer);
    return list;
  }, [customer, restaurant, rider]);

  const region = useMemo(() => {
    if (points.length === 0) {
      return {
        latitude: 19.076,
        longitude: 72.8777,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }
    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.6),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.6),
    };
  }, [points]);

  useEffect(() => {
    if (points.length < 2 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [points]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, { height }]}
      initialRegion={region}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      showsUserLocation={isValidCoord(customer)}
      showsMyLocationButton={false}
    >
      {isValidCoord(restaurant) ? (
        <Marker coordinate={restaurant} title="Restaurant" pinColor="#ff5a00" />
      ) : null}
      {isValidCoord(customer) ? (
        <Marker coordinate={customer} title="You" pinColor="#1a1c1c" />
      ) : null}
      {isValidCoord(rider) ? (
        <Marker coordinate={rider} title="Rider" pinColor="#24963F" />
      ) : null}
      {isValidCoord(restaurant) && isValidCoord(rider) ? (
        <Polyline coordinates={[restaurant, rider]} strokeColor="#ff5a00" strokeWidth={3} />
      ) : null}
      {isValidCoord(rider) && isValidCoord(customer) ? (
        <Polyline
          coordinates={[rider, customer]}
          strokeColor="#24963F"
          strokeWidth={3}
          lineDashPattern={[6, 4]}
        />
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', borderRadius: 16, overflow: 'hidden' },
});
