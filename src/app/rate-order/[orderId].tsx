import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createReview } from '@/services/reviews';
import { toast } from '@/lib/toast';

export default function RateOrderScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const id = orderId ?? '';

  const [rating, setRating] = useState('5');
  const [text, setText] = useState('');

  const m = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast.success('Thanks for your feedback!', 'Review submitted');
      router.replace('/(tabs)/orders');
    },
  });

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Rate order</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText themeColor="textSecondary">Order: {id.slice(-8).toUpperCase()}</ThemedText>

          <ThemedText style={styles.label}>Food rating (1–5)</ThemedText>
          <TextInput
            value={rating}
            onChangeText={setRating}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />

          <ThemedText style={styles.label}>Review</ThemedText>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write your feedback…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.textarea, { color: theme.text }]}
            multiline
          />

          <Pressable
            disabled={m.isPending || !id}
            onPress={async () => {
              const r = Math.max(1, Math.min(5, Number(rating || 5)));
              await m.mutateAsync({
                orderId: id,
                foodRating: r,
                restaurantRating: r,
                deliveryRating: r,
                reviewText: text.trim() || undefined,
              });
            }}
            style={[styles.primaryBtn, (m.isPending || !id) && { opacity: 0.7 }]}
          >
            <ThemedText style={styles.primaryText}>{m.isPending ? 'Submitting…' : 'Submit'}</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 22, color: '#586062' },
  card: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.25)',
  },
  label: { marginTop: 14, fontFamily: 'PlusJakartaSans_700Bold' },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.35)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  primaryBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#ff5a00',
  },
  primaryText: { color: '#fff', fontFamily: 'PlusJakartaSans_700Bold' },
});

