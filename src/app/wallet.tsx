import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchWallet, fetchWalletTransactions } from '@/services/wallet';

export default function WalletScreen() {
  const theme = useTheme();
  const router = useRouter();

  const walletQ = useQuery({ queryKey: ['wallet'], queryFn: fetchWallet });
  const txQ = useQuery({ queryKey: ['wallet', 'transactions'], queryFn: () => fetchWalletTransactions() });

  const balance = Number(walletQ.data?.balance ?? walletQ.data?.walletBalance ?? 0);
  const txs = Array.isArray(txQ.data) ? txQ.data : [];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText>‹ Back</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" style={{ marginTop: 8 }}>
          QuickBite Wallet
        </ThemedText>

        <ThemedView type="backgroundElement" style={[styles.balanceCard, { borderColor: theme.backgroundSelected }]}>
          <ThemedText themeColor="textSecondary">Available balance</ThemedText>
          <ThemedText style={styles.balance}>₹{balance.toFixed(0)}</ThemedText>
        </ThemedView>

        <ThemedText style={styles.sectionTitle}>Recent transactions</ThemedText>
        <FlatList
          data={txs}
          keyExtractor={(item: any, i) => String(item._id ?? i)}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={{ marginTop: 12 }}>
              {txQ.isLoading ? 'Loading…' : 'No transactions yet.'}
            </ThemedText>
          }
          renderItem={({ item }: { item: any }) => (
            <View style={styles.txRow}>
              <ThemedText style={styles.txTitle}>{item.description ?? item.type ?? 'Transaction'}</ThemedText>
              <ThemedText style={[styles.txAmount, Number(item.amount) < 0 && { color: '#E5484D' }]}>
                {Number(item.amount) >= 0 ? '+' : ''}₹{Math.abs(Number(item.amount ?? 0)).toFixed(0)}
              </ThemedText>
            </View>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four },
  balanceCard: { padding: Spacing.four, borderRadius: 16, borderWidth: 1, marginTop: Spacing.three },
  balance: { fontSize: 32, fontFamily: 'PlusJakartaSans_800ExtraBold', marginTop: 6 },
  sectionTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', marginTop: Spacing.four, marginBottom: 8 },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228,190,177,0.2)',
  },
  txTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', flex: 1 },
  txAmount: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
});
