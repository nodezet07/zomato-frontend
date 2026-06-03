import { useState, useMemo } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { logout } from '@/lib/auth';
import {
  useDeleteAddressMutation,
  useProfileQuery,
  useUpdateAddressMutation,
  useDeleteAccountMutation,
} from '@/hooks/queries/profile';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const q = useProfileQuery();

  const addresses = useMemo(() => {
    const list = [...(q.data?.addresses ?? [])];
    return list.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return 0;
    });
  }, [q.data?.addresses]);
  const upd = useUpdateAddressMutation();
  const del = useDeleteAddressMutation();
  const delAcc = useDeleteAccountMutation();

  const [busy, setBusy] = useState(false);
  const [showAddresses, setShowAddresses] = useState(true);

  const user = q.data;

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await delAcc.mutateAsync();
              await logout();
              router.replace('/(auth)');
            } catch (err: any) {
              Alert.alert('Error', err?.message ?? 'Failed to delete account');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  if (q.isLoading) {
    return (
      <ThemedView style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={{ color: theme.textSecondary, marginTop: 12 }}>
          Loading profile...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
          {/* Top Profile Header Card */}
          <LinearGradient
            colors={[theme.backgroundSelected, theme.backgroundElement]}
            style={[styles.profileHeaderCard, { borderColor: theme.backgroundSelected }]}
          >
            <View style={styles.avatarRow}>
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.avatarInitials}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </ThemedText>
                </View>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText style={styles.userNameText}>{user?.fullName || 'Food Lover'}</ThemedText>
                <ThemedText style={[styles.userContactText, { color: theme.textSecondary }]}>
                  {user?.email || 'email@example.com'}
                </ThemedText>
                {user?.mobile && (
                  <ThemedText style={[styles.userContactText, { color: theme.textSecondary }]}>
                    📱 {user.mobile}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* QuickBite Gold Badge */}
            <LinearGradient
              colors={['#ff5a00', '#ff0055']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.goldBadge}
            >
              <Ionicons name="sparkles" size={12} color="#ffffff" />
              <ThemedText style={styles.goldBadgeText}>QuickBite Gold Member</ThemedText>
            </LinearGradient>
          </LinearGradient>

          {/* Quick Balance Section */}
          <View style={[styles.balanceCard, { backgroundColor: theme.backgroundElement }]}>
            <Pressable onPress={() => router.push('/wallet')} style={styles.balanceItem}>
              <Ionicons name="wallet-outline" size={20} color={theme.primary} />
              <View>
                <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                  Wallet Balance
                </ThemedText>
                <ThemedText style={styles.balanceValue}>
                  ₹{user?.walletBalance ?? 0}
                </ThemedText>
              </View>
            </Pressable>
            <View style={[styles.cardDividerVertical, { backgroundColor: theme.backgroundSelected }]} />
            <Pressable
              onPress={() => router.push('/(tabs)/orders')}
              style={styles.balanceItem}
            >
              <Ionicons name="receipt-outline" size={20} color={theme.primary} />
              <View>
                <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                  Total Orders
                </ThemedText>
                <ThemedText style={styles.balanceValue}>History ›</ThemedText>
              </View>
            </Pressable>
          </View>

          {/* Addresses Accordion */}
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
              onPress={() => setShowAddresses(!showAddresses)}
              style={styles.sectionHeader}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="location-outline" size={20} color={theme.primary} />
                <ThemedText style={styles.sectionTitle}>Saved Addresses</ThemedText>
              </View>
              <Ionicons
                name={showAddresses ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>

            {showAddresses && (
              <View style={{ marginTop: 10 }}>
                {addresses.length === 0 ? (
                  <ThemedText style={[styles.emptyAddrText, { color: theme.textSecondary }]}>
                    No saved addresses yet. Add one during checkout!
                  </ThemedText>
                ) : (
                  addresses.map((a) => (
                    <View
                      key={a._id}
                      style={[styles.addrRow, { borderBottomColor: theme.backgroundSelected }]}
                    >
                      {/* Left side: Stylized Icon container */}
                      <View style={[styles.addrIconContainer, { backgroundColor: a.isDefault ? theme.primarySoft : theme.backgroundSelected }]}>
                        <Ionicons
                          name={a.label === 'Home' ? 'home-outline' : a.label === 'Work' ? 'briefcase-outline' : 'location-outline'}
                          size={18}
                          color={a.isDefault ? theme.primary : theme.textSecondary}
                        />
                      </View>

                      {/* Middle: Content */}
                      <View style={styles.addrContent}>
                        <View style={styles.addrHeader}>
                          <ThemedText style={styles.addrLabel}>{a.label}</ThemedText>
                          {a.isDefault && (
                            <LinearGradient
                              colors={['#ff5a00', '#ff8a00']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.defaultBadge}
                            >
                              <ThemedText style={styles.defaultBadgeText}>DEFAULT</ThemedText>
                            </LinearGradient>
                          )}
                        </View>
                        <ThemedText numberOfLines={2} style={[styles.addrText, { color: theme.textSecondary }]}>
                          {a.fullAddress}
                        </ThemedText>
                      </View>

                      {/* Right side: Actions */}
                      <View style={styles.addrActionsRight}>
                        {!a.isDefault ? (
                          <Pressable
                            disabled={busy}
                            onPress={async () => {
                              try {
                                setBusy(true);
                                await upd.mutateAsync({ addressId: a._id, isDefault: true } as any);
                              } finally {
                                setBusy(false);
                              }
                            }}
                            style={[
                              styles.miniActionBtn,
                              { backgroundColor: theme.primarySoft, borderColor: theme.primary },
                            ]}
                          >
                            <ThemedText style={[styles.miniActionBtnText, { color: theme.primary }]}>
                              Use
                            </ThemedText>
                          </Pressable>
                        ) : (
                          <View style={[styles.defaultCheckCircle, { backgroundColor: theme.primary }]}>
                            <Ionicons name="checkmark" size={12} color="#ffffff" />
                          </View>
                        )}
                        <Pressable
                          disabled={busy}
                          onPress={() => {
                            if (busy) return;
                            setBusy(true);
                            Alert.alert('Delete Address', 'Remove this address?', [
                              { 
                                text: 'Cancel', 
                                style: 'cancel',
                                onPress: () => setBusy(false)
                              },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  try {
                                    await del.mutateAsync(a._id);
                                  } catch (err) {
                                    // ignore or log
                                  } finally {
                                    setBusy(false);
                                  }
                                },
                              },
                            ], { onDismiss: () => setBusy(false) });
                          }}
                          style={styles.deleteMiniBtn}
                        >
                          <Ionicons name="trash-outline" size={14} color="#E5484D" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Settings / General Options Card */}
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.cardTitle, { color: theme.textSecondary }]}>Settings</ThemedText>
            
            <Pressable
              onPress={() => router.push('/edit-profile')}
              style={[styles.optionRow, { borderBottomColor: theme.backgroundSelected }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="person-outline" size={18} color={theme.textSecondary} />
                <ThemedText style={styles.optionText}>Edit profile</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/notifications')}
              style={[styles.optionRow, { borderBottomColor: theme.backgroundSelected }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="notifications-outline" size={18} color={theme.textSecondary} />
                <ThemedText style={styles.optionText}>Notifications</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/wallet')}
              style={[styles.optionRow, { borderBottomColor: theme.backgroundSelected }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="card-outline" size={18} color={theme.textSecondary} />
                <ThemedText style={styles.optionText}>Wallet</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/support')}
              style={styles.optionRow}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="help-circle-outline" size={18} color={theme.textSecondary} />
                <ThemedText style={styles.optionText}>Help & Support</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Danger Zone Account deletion & Logout */}
          <View style={[styles.sectionCard, { backgroundColor: theme.backgroundElement }]}>
            <Pressable
              onPress={handleLogout}
              style={[styles.optionRow, { borderBottomColor: theme.backgroundSelected }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="log-out-outline" size={18} color="#E5484D" />
                <ThemedText style={[styles.optionText, { color: '#E5484D', fontFamily: 'PlusJakartaSans_700Bold' }]}>
                  Log Out
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#E5484D" />
            </Pressable>

            <Pressable
              disabled={busy}
              onPress={handleDeleteAccount}
              style={styles.optionRow}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name="trash-outline" size={18} color="#E5484D" />
                <ThemedText style={[styles.optionText, { color: '#E5484D', fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                  Delete Account
                </ThemedText>
              </View>
              {busy ? (
                <ActivityIndicator size="small" color="#E5484D" />
              ) : (
                <Ionicons name="chevron-forward" size={16} color="#E5484D" />
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  // Header Card
  profileHeaderCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3e3e3',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  userNameText: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  userContactText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  goldBadgeText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  // Balance Card
  balanceCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  balanceLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  balanceValue: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_850ExtraBold',
    marginTop: 2,
  },
  cardDividerVertical: {
    width: 1,
    height: '80%',
  },
  // Section Cards
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  emptyAddrText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  // Address Rows
  addrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  addrIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrContent: {
    flex: 1,
    gap: 2,
  },
  addrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addrLabel: {
    fontFamily: 'PlusJakartaSans_750Bold',
    fontSize: 14,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#ffffff',
    fontSize: 7.5,
    fontFamily: 'PlusJakartaSans_800ExtraBold',
  },
  addrText: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    lineHeight: 16,
  },
  addrActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniActionBtnText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  defaultCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteMiniBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,72,77,0.06)',
  },
  // Options
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
