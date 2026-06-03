import { FlatList, Image, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useFavoritesQuery, useToggleFavoriteMutation } from '@/hooks/queries/favorites';

export default function FavoritesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const favsQuery = useFavoritesQuery();
  const toggleFavMut = useToggleFavoriteMutation();
  const items = Array.isArray(favsQuery.data) ? favsQuery.data : [];

  const getDeliveryTime = (restaurant: any) => {
    const avg = restaurant?.averageDeliveryTime;
    if (avg) {
      const min = Math.max(10, avg - 10);
      return `${min}-${avg} mins`;
    }
    return '20-30 mins';
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Premium Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>Favourites</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {items.length > 0 ? `${items.length} saved place${items.length !== 1 ? 's' : ''}` : 'Your saved restaurants'}
          </ThemedText>
        </View>

        <FlatList
          data={items}
          keyExtractor={(r) => String(r._id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={favsQuery.isFetching}
              onRefresh={favsQuery.refetch}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundSelected }]}>
                <Ionicons name="heart-outline" size={36} color={theme.textSecondary} />
              </View>
              <ThemedText style={styles.emptyTitle}>No favourites yet</ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Restaurants you love will appear here. Explore and save your favourites!
              </ThemedText>
              <Pressable
                onPress={() => router.push('/(tabs)')}
                style={[styles.exploreBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={styles.exploreBtnText}>Explore Restaurants</ThemedText>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/restaurant/[restaurantId]',
                  params: { restaurantId: String(item._id) },
                })
              }
              style={({ pressed }) => [pressed && { opacity: 0.95 }]}
            >
              <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.backgroundSelected }]}>
                {/* Banner Image */}
                <View style={styles.bannerContainer}>
                  {item.coverImage || item.logo ? (
                    <Image
                      source={{ uri: item.coverImage ?? item.logo }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.bannerPlaceholder, { backgroundColor: theme.backgroundSelected }]}>
                      <Ionicons name="restaurant" size={32} color={theme.textSecondary} />
                    </View>
                  )}

                  {/* Heart Icon */}
                  <Pressable
                    onPress={() => toggleFavMut.mutate({ restaurantId: String(item._id), has: true })}
                    style={styles.heartButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="heart" size={18} color="#e23744" />
                  </Pressable>

                  {/* Discount / Promo Tag */}
                  {item.discount && (
                    <View style={[styles.promoBadge, { backgroundColor: theme.primary }]}>
                      <ThemedText style={styles.promoBadgeText}>{item.discount}</ThemedText>
                    </View>
                  )}
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                  <View style={styles.nameRow}>
                    <ThemedText style={[styles.restaurantName, { color: theme.text }]} numberOfLines={1}>
                      {item.restaurantName}
                    </ThemedText>
                    <View style={[styles.ratingBadge, { backgroundColor: '#0f8a5f' }]}>
                      <Ionicons name="star" size={8} color="#ffffff" />
                      <ThemedText style={styles.ratingText}>
                        {Number(item.averageRating ?? 4.0).toFixed(1)}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={[styles.cuisinesText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {(item.cuisines ?? []).slice(0, 3).join(' • ') || 'Multi-cuisine'}
                  </ThemedText>

                  <View style={[styles.metaRow, { borderTopColor: theme.backgroundSelected }]}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                      <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                        {getDeliveryTime(item)}
                      </ThemedText>
                    </View>
                    {item.minimumOrderAmount ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="cart-outline" size={12} color={theme.textSecondary} />
                        <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                          Min ₹{item.minimumOrderAmount}
                        </ThemedText>
                      </View>
                    ) : null}
                    {item.isOpen === false ? (
                      <View style={styles.closedBadge}>
                        <ThemedText style={styles.closedText}>CLOSED</ThemedText>
                      </View>
                    ) : null}
                  </View>
                </View>
              </ThemedView>
            </Pressable>
          )}
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
    paddingBottom: 14,
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
    paddingBottom: 50,
    gap: 16,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  bannerContainer: {
    height: 150,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  promoBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  infoSection: {
    padding: 12,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  restaurantName: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 15.5,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  cuisinesText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  closedBadge: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(226,55,68,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  closedText: {
    color: '#e23744',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  exploreBtnText: {
    color: '#ffffff',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 13,
  },
});
