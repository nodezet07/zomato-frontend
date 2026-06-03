import { FlatList, Pressable, RefreshControl, StyleSheet, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOrderHistoryQuery } from '@/hooks/queries/orders';
import type { Order } from '@/services/orders';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  return `${date.toLocaleDateString(undefined, options)} at ${date.toLocaleTimeString(undefined, timeOptions)}`;
}

export default function OrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const q = useOrderHistoryQuery();
  const items = (Array.isArray(q.data) ? q.data : []) as Order[];
  const loading = q.isLoading || q.isFetching;
  const error = (q.error as any)?.message ?? null;

  const getStatusConfig = (status?: string) => {
    const s = (status ?? 'PENDING').toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return { label: 'Delivered', color: '#0f8a5f', icon: 'checkmark-circle' as const };
      case 'CANCELLED':
        return { label: 'Cancelled', color: '#e23744', icon: 'close-circle' as const };
      case 'PENDING':
        return { label: 'Received', color: '#ff5a00', icon: 'time' as const };
      case 'CONFIRMED':
        return { label: 'Confirmed', color: '#ff5a00', icon: 'checkmark-circle' as const };
      case 'PREPARING':
        return { label: 'Preparing', color: '#ff5a00', icon: 'restaurant' as const };
      case 'READY_FOR_PICKUP':
        return { label: 'Ready for Pickup', color: '#ff5a00', icon: 'gift' as const };
      case 'RIDER_ASSIGNED':
      case 'PICKED_UP':
      case 'ON_THE_WAY':
        return { label: 'Out for Delivery', color: '#ff5a00', icon: 'bicycle' as const };
      default:
        return { label: s, color: '#65696f', icon: 'information-circle' as const };
    }
  };

  const isActiveOrder = (status?: string) => {
    const s = (status ?? '').toUpperCase();
    return s !== 'DELIVERED' && s !== 'CANCELLED';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>My Orders</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Your order history & active tracking
          </ThemedText>
        </View>

        {!!error && (
          <ThemedView type="backgroundElement" style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color="#e23744" />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
            <Pressable onPress={() => q.refetch()} style={styles.retryBtn}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        <FlatList
          data={items}
          keyExtractor={(o) => o._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={60} color={theme.backgroundSelected} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                {loading ? 'Fetching your orders...' : 'No orders found.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => {
            const statusConfig = getStatusConfig(item.orderStatus);
            const isOrderActive = isActiveOrder(item.orderStatus);
            const itemsList = item.orderItems?.map((it) => `${it.quantity} x ${it.itemName}`).join(', ') || '';

            return (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/order/[orderId]',
                    params: { orderId: item._id },
                  })
                }
                style={({ pressed }) => [
                  styles.cardWrapper,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.backgroundSelected }]}>
                  {/* Restaurant Row */}
                  <View style={styles.restaurantRow}>
                    <View style={styles.restaurantLeft}>
                      <View style={[styles.restaurantIconCircle, { backgroundColor: theme.backgroundSelected }]}>
                        {item.restaurantId?.logo ? (
                          <Image source={{ uri: item.restaurantId.logo }} style={styles.restaurantLogo} />
                        ) : (
                          <Ionicons name="restaurant" size={16} color={theme.primary} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={[styles.restaurantName, { color: theme.text }]}>
                          {item.restaurantId?.restaurantName || 'Restaurant'}
                        </ThemedText>
                        <ThemedText style={[styles.orderDate, { color: theme.textSecondary }]}>
                          {formatDate(item.createdAt)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.restaurantRight}>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}15` }]}>
                        <Ionicons name={statusConfig.icon} size={10} color={statusConfig.color} style={{ marginRight: 4 }} />
                        <ThemedText style={[styles.statusText, { color: statusConfig.color }]}>
                          {statusConfig.label}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

                  {/* Items list summary */}
                  <View style={styles.itemsSummaryRow}>
                    <ThemedText style={[styles.itemsListText, { color: theme.textSecondary }]} numberOfLines={2}>
                      {itemsList}
                    </ThemedText>
                    <ThemedText style={[styles.totalAmount, { color: theme.text }]}>
                      ₹{item.grandTotal ?? 0}
                    </ThemedText>
                  </View>

                  {/* Quick Action footer */}
                  {isOrderActive && (
                    <View style={styles.footerActionRow}>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/order/track/[orderId]',
                            params: { orderId: item._id },
                          })
                        }
                        style={[styles.actionBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
                      >
                        <Ionicons name="bicycle-outline" size={14} color={theme.primary} />
                        <ThemedText style={[styles.actionBtnText, { color: theme.primary }]}>
                          Track Order (Live)
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}
                </ThemedView>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(127,127,127,0.08)',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  restaurantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  restaurantIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  restaurantLogo: {
    width: '100%',
    height: '100%',
  },
  restaurantName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14.5,
  },
  orderDate: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  restaurantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  itemsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  itemsListText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    flex: 1,
    lineHeight: 17,
  },
  totalAmount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14,
  },
  footerActionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  errorCard: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,55,68,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: '#e23744',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: '#ff5a00',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 12,
  },
});
