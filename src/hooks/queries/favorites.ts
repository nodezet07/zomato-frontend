import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { addFavorite, fetchFavorites, removeFavorite } from '@/services/favorites';

export const favoritesKeys = {
  all: ['favorites'] as const,
};

export function useFavoritesQuery() {
  return useQuery({
    queryKey: favoritesKeys.all,
    queryFn: fetchFavorites,
  });
}

export function useToggleFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { restaurantId: string; has: boolean }) => {
      if (input.has) return removeFavorite(input.restaurantId);
      return addFavorite(input.restaurantId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: favoritesKeys.all }),
  });
}

