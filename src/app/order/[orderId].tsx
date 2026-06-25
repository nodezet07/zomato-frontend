import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOrderByIdQuery } from '@/hooks/queries/orderDetail';
import { requestOrderRefund } from '@/services/orders';
import { useAddToCartMutation } from '@/hooks/queries/cart';
import {
  canTrackOrder,
  getPaymentStatusDisplay,
  isPaymentFailed,
  needsOnlinePayment,
} from '@/lib/orderPayment';

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = orderId ?? '';
  const [refundNote, setRefundNote] = useState('');

  const q = useOrderByIdQuery(id);
  const order: any = q.data;
  const addToCart = useAddToCartMutation();

  const status = String(order?.orderStatus ?? order?.status ?? 'UNKNOWN');
  const isDelivered = status === 'DELIVERED';
  const isCancelled = status === 'CANCELLED';
  const paymentDisplay = order ? getPaymentStatusDisplay(order) : null;
  const showPayAgain = order && needsOnlinePayment(order);
  const paymentFailed = order && isPaymentFailed(order);
  const showTrack = order && canTrackOrder(order);

  function retryPayment() {
    router.push({
      pathname: '/payment/razorpay',
      params: {
        orderId: id,
        restaurantName: order?.restaurantId?.restaurantName ?? '',
      },
    });
  }

  const refundMut = useMutation({
    mutationFn: () => requestOrderRefund(id, refundNote.trim()),
    onSuccess: () => {
      Alert.alert('Refund requested', 'Our support team will review your request.');
      setRefundNote('');
    },
    onError: (e: Error) => Alert.alert('Refund Error', e.message),
  });

  async function reorder() {
    const restaurantId = String(order?.restaurantId?._id ?? order?.restaurantId ?? '');
    const items = order?.orderItems ?? order?.items ?? [];
    if (!restaurantId || items.length === 0) {
      Alert.alert('Reorder', 'Could not load items for this order.');
      return;
    }
    try {
      for (const line of items) {
        const menuItemId = String(line.menuItemId?._id ?? line.menuItemId ?? '');
        if (!menuItemId) continue;
        await addToCart.mutateAsync({
          restaurantId,
          menuItemId,
          quantity: line.quantity ?? 1,
          addons: line.addons ?? [],
        });
      }
      router.push('/cart');
    } catch (e: any) {
      Alert.alert('Reorder Error', e?.message ?? 'Failed to add items to cart.');
    }
  }

  const getStatusColor = (s: string) => {
    switch (s.toUpperCase()) {
      case 'DELIVERED':
        return '#0f8a5f';
      case 'CANCELLED':
        return '#e23744';
      default:
        return '#ff5a00';
    }
  };

  const getFoodTypeIcon = (itemName: string) => {
    const lower = itemName.toLowerCase();
    const isNonVeg =
      lower.includes('chicken') ||
      lower.includes('mutton') ||
      lower.includes('egg') ||
      lower.includes('fish') ||
      lower.includes('kabab') ||
      lower.includes('kebab') ||
      lower.includes('meat') ||
      lower.includes('tikka') ||
      lower.includes('tandoori');

    return (
      <View
        style={[
          styles.foodTypeBorder,
          { borderColor: isNonVeg ? '#e23744' : '#0f8a5f' },
        ]}
      >
        {isNonVeg ? (
          <View style={[styles.nonVegTriangle, { borderBottomColor: '#e23744' }]} />
        ) : (
          <View style={[styles.vegDotInner, { backgroundColor: '#0f8a5f' }]} />
        )}
      </View>
    );
  };

  if (q.isLoading) {
    return (
      <ThemedView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ThemedText style={{ color: theme.textSecondary }}>Loading order details...</ThemedText>
      </ThemedView>
    );
  }

  if (q.isError || !order) {
    return (
      <ThemedView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ThemedView type="backgroundElement" style={styles.errorCard}>
          <ThemedText style={{ color: '#e23744' }}>
            {(q.error as Error)?.message ?? 'Order details not found.'}
          </ThemedText>
        </ThemedView>
        <Pressable onPress={() => router.back()} style={[styles.secondaryBtn, { width: 120 }]}>
          <ThemedText style={styles.secondaryText}>Go Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const items = order.orderItems ?? order.items ?? [];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.backgroundSelected, borderColor: theme.backgroundSelected }]}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Order Summary</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* Status & Restaurant Details Card */}
          <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.backgroundSelected }]}>
            <View style={styles.restaurantRow}>
              <View style={[styles.logoCircle, { backgroundColor: theme.backgroundSelected }]}>
                {order.restaurantId?.logo ? (
                  <Image source={{ uri: order.restaurantId.logo }} style={styles.restaurantLogo} />
                ) : (
                  <Ionicons name="restaurant" size={18} color={theme.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.restaurantName}>
                  {order.restaurantId?.restaurantName || 'Restaurant'}
                </ThemedText>
                <ThemedText style={[styles.orderNumber, { color: theme.textSecondary }]}>
                  Order: #{order.orderNumber ?? id.slice(-8).toUpperCase()}
                </ThemedText>
                <ThemedText style={[styles.orderDate, { color: theme.textSecondary }]}>
                  Placed on {formatDate(order.createdAt)}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected }]} />

            <View style={styles.metaRow}>
              <View>
                <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>ORDER STATUS</ThemedText>
                <ThemedText style={[styles.metaValue, { color: getStatusColor(status) }]}>
                  {status.replace(/_/g, ' ')}
                </ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>PAYMENT</ThemedText>
                <ThemedText
                  style={[
                    styles.metaValue,
                    {
                      color:
                        paymentDisplay?.tone === 'failed'
                          ? '#e23744'
                          : paymentDisplay?.tone === 'pending'
                            ? '#f59e0b'
                            : paymentDisplay?.tone === 'paid'
                              ? '#0f8a5f'
                              : theme.text,
                    },
                  ]}
                >
                  {paymentDisplay?.label ?? '—'}
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {showPayAgain && (
            <ThemedView
              type="backgroundElement"
              style={[
                styles.paymentAlert,
                {
                  borderColor: paymentFailed ? 'rgba(226,55,68,0.35)' : 'rgba(245,158,11,0.45)',
                  backgroundColor: paymentFailed ? 'rgba(226,55,68,0.08)' : 'rgba(245,158,11,0.1)',
                },
              ]}
            >
              <Ionicons
                name={paymentFailed ? 'close-circle' : 'card-outline'}
                size={22}
                color={paymentFailed ? '#e23744' : '#f59e0b'}
              />
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.paymentAlertTitle, { color: theme.text }]}>
                  {paymentFailed ? 'Payment not completed' : 'Payment required'}
                </ThemedText>
                <ThemedText style={[styles.paymentAlertBody, { color: theme.textSecondary }]}>
                  {paymentFailed
                    ? 'Your payment did not go through. Retry to confirm this order with the restaurant.'
                    : 'Complete online payment to confirm your order. The restaurant will accept after payment.'}
                </ThemedText>
              </View>
            </ThemedView>
          )}

          {/* Items Invoice Card */}
          <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.backgroundSelected }]}>
            <ThemedText style={styles.sectionTitle}>Invoice details</ThemedText>
            
            <View style={{ gap: 12, marginTop: 8 }}>
              {items.map((line: any, idx: number) => {
                const addText =
                  line.addons && line.addons.length > 0
                    ? line.addons.map((a: any) => a.name).join(', ')
                    : '';

                return (
                  <View key={idx} style={styles.itemInvoiceRow}>
                    <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
                      <View style={{ marginTop: 2 }}>{getFoodTypeIcon(line.itemName)}</View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.itemNameText}>{line.itemName}</ThemedText>
                        {!!addText && (
                          <ThemedText style={[styles.itemAddonsText, { color: theme.textSecondary }]} numberOfLines={1}>
                            {addText}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <ThemedText style={[styles.itemQtyPrice, { color: theme.text }]}>
                      {line.quantity} x ₹{line.price} = ₹{line.total ?? line.price * line.quantity}
                    </ThemedText>
                  </View>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: theme.backgroundSelected, marginVertical: 14 }]} />

            {/* Bill Summaries */}
            <View style={{ gap: 8 }}>
              <View style={styles.billRow}>
                <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Item Total</ThemedText>
                <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{order.subtotal}</ThemedText>
              </View>
              {!!order.deliveryFee && (
                <View style={styles.billRow}>
                  <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Delivery Fee</ThemedText>
                  <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{order.deliveryFee}</ThemedText>
                </View>
              )}
              {!!order.taxAmount && (
                <View style={styles.billRow}>
                  <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Taxes & charges</ThemedText>
                  <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{order.taxAmount}</ThemedText>
                </View>
              )}
              {!!order.platformFee && (
                <View style={styles.billRow}>
                  <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Platform Fee</ThemedText>
                  <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{order.platformFee}</ThemedText>
                </View>
              )}
              {!!order.couponDiscount && (
                <View style={styles.billRow}>
                  <ThemedText style={[styles.billLabel, { color: '#0f8a5f' }]}>Coupon Discount</ThemedText>
                  <ThemedText style={[styles.billValue, { color: '#0f8a5f' }]}>-₹{order.couponDiscount}</ThemedText>
                </View>
              )}
              {!!order.walletDeduction && (
                <View style={styles.billRow}>
                  <ThemedText style={[styles.billLabel, { color: '#0f8a5f' }]}>Wallet Deduction</ThemedText>
                  <ThemedText style={[styles.billValue, { color: '#0f8a5f' }]}>-₹{order.walletDeduction}</ThemedText>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: theme.backgroundSelected, marginVertical: 8 }]} />

              <View style={styles.billRow}>
                <ThemedText style={[styles.grandTotalLabel, { color: theme.text }]}>Grand Total</ThemedText>
                <ThemedText style={[styles.grandTotalValue, { color: theme.primary }]}>₹{order.grandTotal}</ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Delivery Address Card */}
          {order.customerAddress?.fullAddress && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.backgroundSelected }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ionicons name="location" size={16} color={theme.primary} />
                <ThemedText style={styles.sectionTitle}>Delivered To</ThemedText>
              </View>
              <ThemedText style={[styles.addressText, { color: theme.textSecondary }]}>
                {order.customerAddress.fullAddress}
              </ThemedText>
            </ThemedView>
          )}

          {/* Payment / tracking actions */}
          {showPayAgain && (
            <Pressable
              onPress={retryPayment}
              style={[styles.primaryBtn, { backgroundColor: paymentFailed ? '#e23744' : theme.primary }]}
            >
              <Ionicons name="card" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.primaryText}>
                {paymentFailed ? 'Retry payment' : 'Pay now'}
              </ThemedText>
            </Pressable>
          )}

          {showTrack && (
            <Pressable
              onPress={() => router.push({ pathname: '/order/track/[orderId]', params: { orderId: id } })}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            >
              <Ionicons name="bicycle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <ThemedText style={styles.primaryText}>Track live order</ThemedText>
            </Pressable>
          )}

          {/* Past Order Options */}
          {(isDelivered || isCancelled) && (
            <View style={{ gap: 10 }}>
              <Pressable onPress={reorder} style={[styles.secondaryBtn, { borderColor: theme.primary }]}>
                <Ionicons name="refresh" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                <ThemedText style={[styles.secondaryText, { color: theme.primary }]}>Reorder items</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => router.push({ pathname: '/rate-order/[orderId]', params: { orderId: id } })}
                style={[styles.secondaryBtn, { borderColor: theme.backgroundSelected }]}
              >
                <Ionicons name="star" size={16} color="#fbbf24" style={{ marginRight: 6 }} />
                <ThemedText style={styles.secondaryText}>Rate this order</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Refund Section */}
          {isDelivered && (
            <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.backgroundSelected, marginTop: 6 }]}>
              <ThemedText style={styles.sectionTitle}>Need Help with this order?</ThemedText>
              <ThemedText style={[styles.refundSubtitle, { color: theme.textSecondary }]}>
                If items were missing, spilled or you had quality issues, submit a refund request.
              </ThemedText>
              
              <TextInput
                value={refundNote}
                onChangeText={setRefundNote}
                placeholder="Describe your issue in details (min 10 chars)..."
                multiline
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundSelected, borderColor: theme.backgroundSelected }]}
              />
              
              <Pressable
                disabled={refundMut.isPending || refundNote.trim().length < 10}
                onPress={() => refundMut.mutate()}
                style={({ pressed }) => [
                  styles.refundSubmitBtn,
                  { backgroundColor: refundNote.trim().length >= 10 ? '#e23744' : theme.backgroundSelected },
                  pressed && { opacity: 0.9 },
                ]}
              >
                <ThemedText style={[styles.refundSubmitText, { color: refundNote.trim().length >= 10 ? '#ffffff' : theme.textSecondary }]}>
                  {refundMut.isPending ? 'Submitting...' : 'Request Refund'}
                </ThemedText>
              </Pressable>
            </ThemedView>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16.5,
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  restaurantLogo: {
    width: '100%',
    height: '100%',
  },
  restaurantName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15,
  },
  orderNumber: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    marginTop: 2,
  },
  orderDate: {
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 8.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_750Bold',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
  },
  itemInvoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  foodTypeBorder: {
    width: 12,
    height: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  vegDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nonVegTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    backgroundColor: 'transparent',
  },
  itemNameText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12.5,
  },
  itemAddonsText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  itemQtyPrice: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  billValue: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  grandTotalLabel: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14,
  },
  grandTotalValue: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15.5,
  },
  addressText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 16.5,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
  },
  primaryText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13.5,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  secondaryText: {
    color: '#1a1c1c',
    fontFamily: 'PlusJakartaSans_750Bold',
    fontSize: 13,
  },
  refundSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 15,
  },
  input: {
    minHeight: 80,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  refundSubmitBtn: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundSubmitText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 12,
  },
  errorCard: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,55,68,0.2)',
  },
  paymentAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  paymentAlertTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
  },
  paymentAlertBody: {
    marginTop: 4,
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 16,
  },
});
