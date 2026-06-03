import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';
import { useApplyCouponMutation } from '@/hooks/queries/cart';
import { useCouponsByRestaurantQuery } from '@/hooks/queries/coupons';

export default function CouponsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { cart } = useCart();
  const restaurantId = String((cart?.restaurantId as any)?._id ?? cart?.restaurantId ?? '');
  const couponsQ = useCouponsByRestaurantQuery(restaurantId);
  const apply = useApplyCouponMutation();

  const coupons = Array.isArray(couponsQ.data) ? couponsQ.data : [];

  async function onApply(code: string) {
    try {
      await apply.mutateAsync({ couponCode: code });
      Alert.alert('Applied', `Coupon ${code} applied to cart.`);
      router.back();
    } catch (e: any) {
      Alert.alert('Coupon', e?.message ?? 'Could not apply coupon');
    }
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText>‹ Back</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" style={{ marginTop: 8 }}>
          Apply coupon
        </ThemedText>
        {!restaurantId ? (
          <ThemedText themeColor="textSecondary" style={{ marginTop: 12 }}>
            Add items to cart from a restaurant first.
          </ThemedText>
        ) : (
          <FlatList
            data={coupons}
            keyExtractor={(item: any) => String(item._id ?? item.code)}
            contentContainerStyle={{ paddingTop: 12 }}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary">
                {couponsQ.isLoading ? 'Loading coupons…' : 'No coupons for this restaurant.'}
              </ThemedText>
            }
            renderItem={({ item }: { item: any }) => (
              <Pressable
                onPress={() => onApply(item.code)}
                style={[styles.card, { borderColor: theme.backgroundSelected }]}
              >
                <ThemedText style={styles.code}>{item.code}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.desc}>
                  {item.description ?? `${item.discountType} — ${item.discountValue}`}
                </ThemedText>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four },
  card: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  code: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16 },
  desc: { marginTop: 4, fontSize: 12 },
});
