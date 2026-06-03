import { useQuery } from '@tanstack/react-query';

import { fetchMenuItemDetails, fetchMenuItemsByRestaurant, fetchCombosByRestaurant } from '@/services/menu';

export const menuKeys = {
  byRestaurant: (restaurantId: string) => ['menu', 'restaurant', restaurantId] as const,
  combos: (restaurantId: string) => ['menu', 'restaurant', restaurantId, 'combos'] as const,
  item: (itemId: string) => ['menu', 'item', itemId] as const,
};

export function useMenuByRestaurantQuery(restaurantId: string) {
  return useQuery({
    queryKey: menuKeys.byRestaurant(restaurantId),
    queryFn: () => fetchMenuItemsByRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useCombosByRestaurantQuery(restaurantId: string) {
  return useQuery({
    queryKey: menuKeys.combos(restaurantId),
    queryFn: () => fetchCombosByRestaurant(restaurantId),
    enabled: Boolean(restaurantId),
  });
}

export function useMenuItemQuery(itemId: string) {
  return useQuery({
    queryKey: menuKeys.item(itemId),
    queryFn: () => fetchMenuItemDetails(itemId),
    enabled: Boolean(itemId),
  });
}

