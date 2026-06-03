import { useQuery } from '@tanstack/react-query';

import { fetchRecommendedRestaurants, fetchRestaurantById } from '@/services/restaurants';

export const restaurantKeys = {
  byId: (restaurantId: string) => ['restaurants', 'byId', restaurantId] as const,
  recommended: ['restaurants', 'recommended'] as const,
};

export function useRestaurantByIdQuery(restaurantId: string) {
  return useQuery({
    queryKey: restaurantKeys.byId(restaurantId),
    queryFn: () => fetchRestaurantById(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useRecommendedRestaurantsQuery() {
  return useQuery({
    queryKey: restaurantKeys.recommended,
    queryFn: fetchRecommendedRestaurants,
  });
}

