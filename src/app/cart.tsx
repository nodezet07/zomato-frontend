import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeGradient } from '@/components/safe-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/lib/toast';
import {
  useApplyCouponMutation,
  useClearCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCouponMutation,
  useAddToCartMutation,
  useUpdateCartPreferencesMutation,
} from '@/hooks/queries/cart';
import { fetchMenuItemsByRestaurant, type MenuItem } from '@/services/menu';
import { storageGetItem, storageSetItem } from '@/lib/storage';
import { V1_WALLET_ENABLED } from '@/config/features';
import { useCouponsByRestaurantQuery } from '@/hooks/queries/coupons';
import { formatCouponDescription, pickPrimaryCoupon } from '@/lib/offerDisplay';

type PaymentMethod = 'COD' | 'ONLINE';

function getDeliveryTimeLabel(restaurant?: { averageDeliveryTime?: number }) {
  if (restaurant?.averageDeliveryTime) {
    const avg = restaurant.averageDeliveryTime;
    const minTime = Math.max(5, avg - 10);
    return `${minTime}-${avg} mins`;
  }
  return '15-20 mins';
}
                               
export default function CartScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cart, loading } = useCart();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const checkoutBarPaddingBottom = bottomInset + 10;
  const checkoutBarHeight = 108 + checkoutBarPaddingBottom;

  const updateLine = useUpdateCartItemMutation();
  const removeLine = useRemoveCartItemMutation();
  const clear = useClearCartMutation();
  const apply = useApplyCouponMutation();
  const removeCoupon = useRemoveCouponMutation();
  const addToCartMut = useAddToCartMutation();
  const updatePrefs = useUpdateCartPreferencesMutation();

  const [couponCode, setCouponCode] = useState('');                       
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noCutlery, setNoCutlery] = useState(true);
  const [recommendations, setRecommendations] = useState<MenuItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
                                                                                   
  const mutating =
    updateLine.isPending ||
    removeLine.isPending ||
    clear.isPending ||
    apply.isPending ||
    removeCoupon.isPending ||
    addToCartMut.isPending ||
    updatePrefs.isPending;

  const restaurant = cart?.restaurantId as any;
  const restaurantId =
    typeof restaurant === 'object' && restaurant?._id
      ? String(restaurant._id)
      : typeof cart?.restaurantId === 'string'
        ? cart.restaurantId
        : '';
  const couponsQ = useCouponsByRestaurantQuery(restaurantId);
  const suggestedCoupon = pickPrimaryCoupon(couponsQ.data?.coupons ?? []);
  const deliveryTimeStr = getDeliveryTimeLabel(restaurant);

  // Sync preferences from backend cart object
  useEffect(() => {
    if (cart) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local draft fields from server cart snapshot
      setNote(cart.generalNote ?? '');
      setNoCutlery(cart.dontSendCutlery ?? false);
    }
  }, [cart]);

  // Fetch recommendations from this restaurant's menu
  useEffect(() => {
    if (restaurant?._id) {
      fetchMenuItemsByRestaurant(restaurant._id)
        .then((items) => {
          // Filter out items already in the cart and take first 5
          const inCartIds = new Set(cart?.items.map((it) => it.menuItemId) ?? []);
          const filtered = items.filter((it) => !inCartIds.has(it._id)).slice(0, 5);
          setRecommendations(filtered);
        })
        .catch((err) => console.log('Error fetching recs', err));
    }
  }, [restaurant?._id, cart?.items]);

  useEffect(() => {
    async function loadPayment() {
      const saved = await storageGetItem('paymentMethod');
      if (saved === 'ONLINE' || saved === 'COD') {
        setPaymentMethod(saved);
      }
    }
    loadPayment();
  }, []);

  const selectPaymentMethod = () => {
    Alert.alert('Payment method', 'Choose how you want to pay', [
      {
        text: 'Cash on Delivery',
        onPress: async () => {
          setPaymentMethod('COD');
          await storageSetItem('paymentMethod', 'COD');
        },
      },
      {
        text: 'Online Payment',
        onPress: async () => {
          setPaymentMethod('ONLINE');
          await storageSetItem('paymentMethod', 'ONLINE');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddRecommendation = async (item: MenuItem) => {
    if (mutating) return;
    try {
      await addToCartMut.mutateAsync({
        restaurantId: restaurant._id,
        menuItemId: item._id,
        quantity: 1,
        addons: [],
      });
      toast.success(`Added ${item.itemName}`, 'Added to cart');
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? e?.message ?? 'Failed to add item');
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

  if (loading && !cart) {
    return (
      <ThemedView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: 12 }}>Loading your cart...</ThemedText>
      </ThemedView>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.headerRow, { backgroundColor: theme.background, borderBottomColor: theme.backgroundSelected }]}>
            <Pressable onPress={() => router.back()} style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Cart</ThemedText>
            <View style={{ width: 36 }} />
          </View>
          <View style={[styles.center, { flex: 1 }]}>
            <Ionicons name="cart-outline" size={80} color={theme.backgroundSelected} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add items from a restaurant to start your order!
            </ThemedText>
            <Pressable onPress={() => router.push('/(tabs)')} style={[styles.shopBtn, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.shopBtnText}>Browse Restaurants</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // Calculate fees and totals with fallbacks
  const subtotal = cart.subtotal ?? 0;
  const deliveryFee = cart.deliveryFee ?? 0;
  const platformFee = (cart as any).platformFee ?? 0;
  const taxAmount = (cart as any).taxAmount ?? 0;
  const couponDiscount = (cart as any).couponDiscount ?? 0;
  const appliedCoupon = cart.appliedCouponId as any;
  const grandTotal = Math.max(0, (cart as any).grandTotal);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={[styles.headerRow, { backgroundColor: theme.background, borderBottomColor: theme.backgroundSelected }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
            <Pressable onPress={() => router.back()} style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <View>
              <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
                {restaurant?.restaurantName || 'Hotel Nukkad'}
              </ThemedText>
              <Pressable
                onPress={() => router.push('/(onboarding)/location')}
                style={styles.locationSelector}
              >
                <ThemedText style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
                  <ThemedText style={{ color: theme.primary, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    {deliveryTimeStr}
                  </ThemedText>{' '}
                  to Home | Connaught Place
                </ThemedText>
                <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>
          <Pressable style={[styles.iconCircle, { backgroundColor: theme.backgroundSelected }]}>
            <Ionicons name="share-social-outline" size={18} color={theme.text} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollBody, { paddingBottom: checkoutBarHeight + 16 }]}
        >
          {/* Cart Items List */}
          <View style={[styles.itemsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            {cart.items.map((it) => {
              const portionName =
                it.addons && it.addons.length > 0
                  ? it.addons.map((a: { name: string }) => a.name.replace('Portion: ', '')).join(', ')
                  : 'Half';

              return (
                <View key={it._id} style={[styles.cartItemRow, { borderBottomColor: theme.backgroundSelected }]}>
                  {/* Left Column: Food Type Dot & Name */}
                  <View style={{ flexDirection: 'row', flex: 1, gap: 10 }}>
                    <View style={{ marginTop: 3 }}>{getFoodTypeIcon(it.itemName)}</View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.itemNameText, { color: theme.text }]}>{it.itemName}</ThemedText>
                      <ThemedText style={[styles.itemPortionText, { color: theme.textSecondary }]}>{portionName}</ThemedText>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/restaurant/[restaurantId]',
                            params: { restaurantId: restaurant?._id },
                          })
                        }
                        style={styles.editItemBtn}
                      >
                        <ThemedText style={[styles.editItemText, { color: theme.primary }]}>Edit</ThemedText>
                        <Ionicons name="caret-forward" size={10} color={theme.primary} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Right Column: Qty & Price */}
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.quantityContainer, { backgroundColor: theme.primary }]}>
                      <Pressable
                        disabled={mutating}
                        onPress={async () => {
                          if (it.quantity <= 1) {
                            Alert.alert('Remove item', `Remove ${it.itemName}?`, [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: async () => {
                                  await removeLine.mutateAsync({ itemId: it._id });
                                  toast.info(`${it.itemName} removed from cart`);
                                },
                              },
                            ]);
                          } else {
                            await updateLine.mutateAsync({
                              itemId: it._id,
                              quantity: it.quantity - 1,
                            });
                          }
                        }}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={14} color="#ffffff" />
                      </Pressable>
                      <ThemedText style={styles.qtyValueText}>{it.quantity}</ThemedText>
                      <Pressable
                        disabled={mutating}
                        onPress={() =>
                          updateLine.mutateAsync({
                            itemId: it._id,
                            quantity: it.quantity + 1,
                          })
                        }
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="add" size={14} color="#ffffff" />
                      </Pressable>
                    </View>
                    <ThemedText style={[styles.itemPriceText, { color: theme.text }]}>₹{it.price * it.quantity}</ThemedText>
                  </View>
                </View>
              );
            })}

            {/* Add More Items & Note Actions */}
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/restaurant/[restaurantId]',
                  params: { restaurantId: restaurant?._id },
                })
              }
              style={styles.addMoreRow}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
              <ThemedText style={[styles.addMoreText, { color: theme.primary }]}>Add more items</ThemedText>
            </Pressable>

            {/* Quick Action Capsules */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingVertical: 12 }}
            >
              <Pressable
                onPress={() => setShowNoteInput(!showNoteInput)}
                style={[
                  styles.actionCapsule,
                  { borderColor: theme.backgroundSelected },
                  showNoteInput && { borderColor: theme.primary, backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons name="document-text-outline" size={14} color={showNoteInput ? theme.primary : theme.textSecondary} />
                <ThemedText style={[styles.actionCapsuleText, { color: theme.textSecondary }, showNoteInput && { color: theme.primary, fontFamily: 'PlusJakartaSans_700Bold' }]} numberOfLines={1}>
                  {note ? 'Edit note' : 'Add note'}
                </ThemedText>
              </Pressable>

              <Pressable
                disabled={mutating}
                onPress={async () => {
                  const nextVal = !noCutlery;
                  setNoCutlery(nextVal);
                  await updatePrefs.mutateAsync({ dontSendCutlery: nextVal });
                }}
                style={[
                  styles.actionCapsule,
                  { borderColor: theme.backgroundSelected },
                  noCutlery && { borderColor: theme.primary, backgroundColor: theme.primarySoft },
                ]}
              >
                <Ionicons name="restaurant-outline" size={14} color={noCutlery ? theme.primary : theme.textSecondary} />
                <ThemedText style={[styles.actionCapsuleText, { color: theme.textSecondary }, noCutlery && { color: theme.primary, fontFamily: 'PlusJakartaSans_700Bold' }]} numberOfLines={1}>
                  {noCutlery ? 'No cutlery' : 'Send cutlery'}
                </ThemedText>
              </Pressable>
            </ScrollView>

            {/* Note input field */}
            {showNoteInput && (
              <View style={[styles.noteInputContainer, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="E.g., Make it extra spicy, No onions..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.noteTextInput, { color: theme.text }]}
                  onBlur={async () => {
                    await updatePrefs.mutateAsync({ generalNote: note.trim() });
                  }}
                />
                {note.length > 0 && (
                  <Pressable
                    onPress={async () => {
                      setNote('');
                      await updatePrefs.mutateAsync({ generalNote: '' });
                    }}
                  >
                    <Ionicons name="close" size={16} color={theme.textSecondary} />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Recommendations: Complete your meal with */}
          {recommendations.length > 0 && (
            <View style={styles.recsSection}>
              <View style={styles.recsHeader}>
                <Ionicons name="grid-outline" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.recsTitle, { color: theme.text }]}>Complete your meal with</ThemedText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 14 }}
              >
                {recommendations.map((item) => (
                  <View key={item._id} style={[styles.recCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                    <View style={styles.recImageContainer}>
                      <Image
                        source={{
                          uri:
                            item.images?.[0] ||
                            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop&q=80',
                        }}
                        style={styles.recImage}
                      />
                      <Pressable
                        onPress={() => handleAddRecommendation(item)}
                        style={styles.recAddBtn}
                      >
                        <Ionicons name="add" size={16} color={theme.primary} />
                      </Pressable>
                    </View>
                    <View style={styles.recContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        {getFoodTypeIcon(item.itemName)}
                        <ThemedText style={[styles.recItemName, { color: theme.text }]} numberOfLines={1}>
                          {item.itemName}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.recItemPrice, { color: theme.textSecondary }]}>₹{item.price}</ThemedText>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Coupon Code Section */}
          <View style={[styles.couponCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <View style={styles.couponRow}>
              <Ionicons name="pricetag-outline" size={18} color={theme.primary} />
              {appliedCoupon ? (
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.couponCodeTitle, { color: theme.text }]}>
                    Saved ₹{couponDiscount} with &apos;{appliedCoupon.couponCode}&apos;
                  </ThemedText>
                  <ThemedText style={[styles.couponSubText, { color: theme.primary }]}>Coupon discount applied</ThemedText>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <ThemedText style={[styles.couponCodeTitle, { color: theme.text }]}>
                    {suggestedCoupon
                      ? `Try '${suggestedCoupon.couponCode}' — ${formatCouponDescription(suggestedCoupon)}`
                      : 'Apply a coupon to save on this order'}
                  </ThemedText>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/restaurant/[restaurantId]',
                        params: { restaurantId: restaurantId || restaurant?._id },
                      })
                    }
                  >
                    <ThemedText style={[styles.viewCouponsLink, { color: theme.primary }]}>View all coupons ›</ThemedText>
                  </Pressable>
                </View>
              )}

              {appliedCoupon ? (
                <Pressable
                  disabled={mutating}
                  onPress={async () => {
                    await removeCoupon.mutateAsync();
                    toast.info('Coupon removed');
                  }}
                  style={styles.applyButton}
                >
                  <ThemedText style={[styles.applyButtonText, { color: theme.primary }]}>
                    REMOVE
                  </ThemedText>
                </Pressable>
              ) : (
                <View style={[styles.couponInputRow, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
                  <TextInput
                    value={couponCode}
                    onChangeText={setCouponCode}
                    placeholder="Enter Code"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    style={[styles.couponMiniInput, { color: theme.text }]}
                  />
                  <Pressable
                    disabled={mutating || !couponCode.trim()}
                    onPress={async () => {
                      try {
                        await apply.mutateAsync({ couponCode: couponCode.trim() });
                        setCouponCode('');
                        toast.success('Coupon applied successfully', 'Saved');
                      } catch (e: any) {
                        toast.error(
                          e?.response?.data?.message ?? e?.message ?? 'Failed to apply coupon',
                          'Coupon',
                        );
                      }
                    }}
                    style={styles.applyButton}
                  >
                    <ThemedText style={[styles.applyButtonText, { color: theme.primary }]}>APPLY</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          </View>


          {V1_WALLET_ENABLED ? (
            <Pressable
              onPress={() => toast.info('Single tap payments and instant refunds', 'QuickBite Money')}
              style={[styles.zomatoMoneyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}
            >
              <View style={styles.zomatoMoneyLeft}>
                <View style={[styles.moneyIconCircle, { backgroundColor: theme.backgroundSelected }]}>
                  <Ionicons name="wallet-outline" size={18} color={theme.primary} />
                </View>
                <View>
                  <ThemedText style={[styles.zomatoMoneyTitle, { color: theme.text }]}>QuickBite Money</ThemedText>
                  <ThemedText style={[styles.zomatoMoneySub, { color: theme.textSecondary }]}>
                    Single tap payments. Zero failures
                  </ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}

          {/* Price Breakdown Bill Details */}
          <View style={[styles.billDetailsCard, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.billDetailsTitle, { color: theme.text }]}>Bill Details</ThemedText>
            <View style={styles.billRow}>
              <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Item Total</ThemedText>
              <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{subtotal}</ThemedText>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.billRow}>
                <ThemedText style={[styles.billLabel, { color: theme.primary }]}>Coupon Discount</ThemedText>
                <ThemedText style={[styles.billValue, { color: theme.primary }]}>-₹{couponDiscount}</ThemedText>
              </View>
            )}
            <View style={styles.billRow}>
              <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Delivery Charge</ThemedText>
              <ThemedText style={[styles.billValue, { color: theme.text }]}>
                {deliveryFee === 0 ? (
                  <ThemedText style={{ color: theme.primary }}>FREE</ThemedText>
                ) : (
                  `₹${deliveryFee}`
                )}
              </ThemedText>
            </View>
            <View style={styles.billRow}>
              <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Govt Taxes & Restaurant Charges</ThemedText>
              <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{taxAmount}</ThemedText>
            </View>
            <View style={styles.billRow}>
              <ThemedText style={[styles.billLabel, { color: theme.textSecondary }]}>Platform Fee</ThemedText>
              <ThemedText style={[styles.billValue, { color: theme.text }]}>₹{platformFee}</ThemedText>
            </View>
            <View style={[styles.cardSeparator, { backgroundColor: theme.backgroundSelected, marginVertical: 12 }]} />
            <View style={styles.billRow}>
              <ThemedText style={[styles.billDetailsTitle, { fontSize: 15, color: theme.text }]}>Grand Total</ThemedText>
              <ThemedText style={[styles.billDetailsTitle, { fontSize: 16, color: theme.primary }]}>
                ₹{grandTotal}
              </ThemedText>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Checkout Bar */}
        <View
          style={[
            styles.bottomCheckoutBar,
            {
              backgroundColor: theme.backgroundElement,
              borderTopColor: theme.backgroundSelected,
              paddingBottom: checkoutBarPaddingBottom,
            },
          ]}
        >
          <Pressable onPress={selectPaymentMethod} style={styles.paymentMethodSelect}>
            <View>
              <ThemedText style={styles.payUsingLabel}>PAY USING</ThemedText>
              <ThemedText style={styles.payUsingMethod}>
                {paymentMethod === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}
              </ThemedText>
            </View>
            <Ionicons name="chevron-up" size={16} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            disabled={mutating}
            onPress={async () => {
              await storageSetItem('paymentMethod', paymentMethod);
              router.push('/checkout');
            }}
            style={styles.placeOrderBtn}
          >
            <SafeGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.placeOrderGradient}
            >
              <View style={{ alignItems: 'flex-start' }}>
                <ThemedText style={styles.btnTotalText}>₹{grandTotal}</ThemedText>
                <ThemedText style={styles.btnTotalLabel}>TOTAL</ThemedText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <ThemedText style={styles.placeOrderText}>Proceed to Checkout</ThemedText>
                <Ionicons name="caret-forward" size={14} color="#ffffff" />
              </View>
            </SafeGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1d20',
    backgroundColor: '#111214',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1c1d20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
    color: '#ffffff',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    color: '#9fa2a7',
    maxWidth: 200,
  },
  scrollBody: {
    padding: 14,
    gap: 14,
  },
  // Savings
  goldSavingsBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  goldSavingsText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  // Special Offer
  specialOfferCard: {
    backgroundColor: '#1c1d20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  specialOfferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialOfferTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
  },
  specialOfferBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  districtBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ff5a00',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  districtText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 10,
  },
  districtSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 5.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginTop: -2,
  },
  offerPromoText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    lineHeight: 16,
  },
  claimLink: {
    color: '#3b82f6',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginTop: 4,
  },
  addedBadge: {
    borderWidth: 1,
    borderColor: '#ff5a00',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,90,0,0.08)',
  },
  addedBadgeText: {
    color: '#ff5a00',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  freeText: {
    fontSize: 11,
    color: '#3b82f6',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginTop: 4,
  },
  // Items
  itemsCard: {
    backgroundColor: '#1c1d20',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#26282d',
  },
  foodTypeBorder: {
    width: 13,
    height: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2.5,
  },
  vegDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  nonVegTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    backgroundColor: 'transparent',
  },
  itemNameText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  itemPortionText: {
    fontSize: 12,
    color: '#9fa2a7',
    marginTop: 2,
  },
  editItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  editItemText: {
    color: '#ff5a00',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ff5a00',
    overflow: 'hidden',
    height: 32,
    width: 80,
  },
  qtyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  qtyValueText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
    width: 24,
    textAlign: 'center',
  },
  itemPriceText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
    marginTop: 2,
  },
  addMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addMoreText: {
    color: '#ff5a00',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  actionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    maxWidth: 160,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2c2e33',
    backgroundColor: 'transparent',
  },
  actionCapsuleText: {
    color: '#9fa2a7',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    flexShrink: 1,
  },
  noteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111214',
    borderWidth: 1,
    borderColor: '#2c2e33',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  noteTextInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  // Recs
  recsSection: {
    marginTop: 4,
  },
  recsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  recsTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
  },
  recCard: {
    width: 100,
    backgroundColor: '#1c1d20',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  recImageContainer: {
    position: 'relative',
    height: 80,
  },
  recImage: {
    width: '100%',
    height: '100%',
  },
  recAddBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  recContent: {
    padding: 6,
    gap: 2,
  },
  recItemName: {
    fontSize: 10,
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_700Bold',
    flex: 1,
  },
  recItemPrice: {
    fontSize: 10,
    color: '#9fa2a7',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  // Coupon
  couponCard: {
    backgroundColor: '#1c1d20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponCodeTitle: {
    fontFamily: 'PlusJakartaSans_750Bold',
    fontSize: 12,
    color: '#ffffff',
  },
  couponSubText: {
    fontSize: 10,
    color: '#24963F',
    marginTop: 1,
  },
  viewCouponsLink: {
    fontSize: 10.5,
    color: '#ff5a00',
    fontFamily: 'PlusJakartaSans_700Bold',
    marginTop: 2,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c2e33',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 32,
    backgroundColor: '#111214',
    width: 130,
  },
  couponMiniInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    paddingVertical: 0,
  },
  applyButton: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ff5a00',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  // VIP Card
  vipCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 0, 0.15)',
  },
  vipDiamondPill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
  },
  vipBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  vipBullet: {
    color: '#ff5a00',
    fontSize: 10,
  },
  vipBulletText: {
    color: '#9fa2a7',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  vipAddBtn: {
    borderWidth: 1,
    borderColor: '#ff5a00',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  vipFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1c1d20',
    marginTop: 12,
    paddingTop: 10,
    gap: 2,
  },
  vipFooterTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 12,
  },
  vipFooterSub: {
    color: '#586062',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  // Zomato Money
  zomatoMoneyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1d20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  zomatoMoneyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moneyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2c2e33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zomatoMoneyTitle: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_750Bold',
    fontSize: 12,
  },
  zomatoMoneySub: {
    color: '#9fa2a7',
    fontSize: 10,
    marginTop: 1,
  },
  // Bill details
  billDetailsCard: {
    backgroundColor: '#1c1d20',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  billDetailsTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
    color: '#ffffff',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 12,
    color: '#9fa2a7',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  billValue: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#26282d',
    marginVertical: 10,
  },
  // Empty State
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    color: '#ffffff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#9fa2a7',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  shopBtn: {
    backgroundColor: '#ff5a00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  shopBtnText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
  },
  // Sticky footer
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1c1d20',
    borderTopWidth: 1,
    borderTopColor: '#26282d',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  paymentMethodSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  payUsingLabel: {
    fontSize: 7.5,
    color: '#9fa2a7',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.6,
  },
  payUsingMethod: {
    fontSize: 11,
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  placeOrderBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  placeOrderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    height: 48,
  },
  btnTotalText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 14,
  },
  btnTotalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    marginTop: -2,
  },
  placeOrderText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_850ExtraBold',
    fontSize: 14,
    fontWeight: '800',
  },
});
