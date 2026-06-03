import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OrderSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const id = orderId ?? '';

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={72} color={theme.primary} />
          </View>
        </View>

        <ThemedText type="subtitle" style={styles.title}>
          Order placed!
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Your food is being prepared. You can track delivery status anytime.
        </ThemedText>

        {id ? (
          <ThemedText themeColor="textSecondary" style={styles.orderId}>
            Order #{id.slice(-8).toUpperCase()}
          </ThemedText>
        ) : null}

        <View style={styles.actions}>
          {id ? (
            <Pressable
              onPress={() =>
                router.replace({
                  pathname: '/order/track/[orderId]',
                  params: { orderId: id },
                })
              }
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.primaryBtnText}>Track order</ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => router.replace('/(tabs)/orders')}
            style={[styles.secondaryBtn, { borderColor: theme.backgroundSelected }]}
          >
            <ThemedText style={styles.secondaryBtnText}>View my orders</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.linkBtn}>
            <ThemedText style={[styles.linkText, { color: theme.primary }]}>Back to home</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: { marginBottom: Spacing.four },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center', marginTop: Spacing.two },
  subtitle: { textAlign: 'center', marginTop: Spacing.two, lineHeight: 22, maxWidth: 300 },
  orderId: { marginTop: Spacing.three, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },
  actions: { width: '100%', marginTop: Spacing.five, gap: 12 },
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#1a1c1c',
  },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  linkText: { fontFamily: 'PlusJakartaSans_700Bold' },
});
