import { useQuery } from '@tanstack/react-query';

import { fetchOrderById, trackOrder } from '@/services/orders';

export const orderDetailKeys = {
  byId: (orderId: string) => ['orders', 'byId', orderId] as const,
  track: (orderId: string) => ['orders', 'track', orderId] as const,
};

export function useOrderByIdQuery(orderId: string) {
  return useQuery({
    queryKey: orderDetailKeys.byId(orderId),
    queryFn: () => fetchOrderById(orderId),
    enabled: Boolean(orderId),
  });
}

export function useOrderTrackQuery(orderId: string) {
  return useQuery({
    queryKey: orderDetailKeys.track(orderId),
    queryFn: () => trackOrder(orderId),
    enabled: Boolean(orderId),
    staleTime: 120_000,
  });
}

