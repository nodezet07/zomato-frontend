import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToCart, applyCoupon, clearCart, fetchCart, removeCartItem, removeCoupon, updateCartItem, updateCartPreferences } from '@/services/cart';

export const cartKeys = {
  all: ['cart'] as const,
};

export function useCartQuery() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: fetchCart,
  });
}

export function useAddToCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addToCart,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useUpdateCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useRemoveCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useClearCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useApplyCouponMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: applyCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useRemoveCouponMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

export function useUpdateCartPreferencesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCartPreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.all }),
  });
}

