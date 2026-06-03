import { useQuery } from '@tanstack/react-query';

import { searchGlobal, fetchTrendingSearches } from '@/services/search';

export const searchKeys = {
  global: (q: string) => ['search', 'global', q] as const,
  trending: ['search', 'trending'] as const,
};

export function useGlobalSearchQuery(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: searchKeys.global(query),
    queryFn: () => searchGlobal(query),
    enabled: query.length > 0,
  });
}

export function useTrendingSearchesQuery() {
  return useQuery({
    queryKey: searchKeys.trending,
    queryFn: fetchTrendingSearches,
  });
}


