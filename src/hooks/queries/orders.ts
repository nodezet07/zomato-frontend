import { useQuery } from '@tanstack/react-query';

import { fetchOrderHistory } from '@/services/orders';

export const orderKeys = {
  history: ['orders', 'history'] as const,
};

export function useOrderHistoryQuery() {
  return useQuery({
    queryKey: orderKeys.history,
    queryFn: fetchOrderHistory,
  });
}

