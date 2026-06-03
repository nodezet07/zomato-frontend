import { useQuery } from '@tanstack/react-query';
import { fetchCouponsByRestaurant } from '@/services/coupons';

export const couponKeys = {
  byRestaurant: (restaurantId: string) => ['coupons', 'restaurant', restaurantId] as const,
};

export function useCouponsByRestaurantQuery(restaurantId: string) {
  return useQuery({
    queryKey: couponKeys.byRestaurant(restaurantId),
    queryFn: () => fetchCouponsByRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
