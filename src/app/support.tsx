import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createSupportTicket, fetchSupportTickets } from '@/services/support';

const ISSUE_TYPES = ['PAYMENT', 'DELIVERY', 'FOOD', 'REFUND', 'OTHER'];

export default function SupportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('ORDER_ISSUE');

  const ticketsQ = useQuery({ queryKey: ['support', 'tickets'], queryFn: fetchSupportTickets });

  const create = useMutation({
    mutationFn: () =>
      createSupportTicket({
        issueType,
        description: description.trim(),
      }),
    onSuccess: async () => {
      setDescription('');
      await qc.invalidateQueries({ queryKey: ['support', 'tickets'] });
      Alert.alert('Submitted', 'Support ticket created. We will respond soon.');
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const tickets = Array.isArray(ticketsQ.data) ? ticketsQ.data : [];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()}>
          <ThemedText>‹ Back</ThemedText>
        </Pressable>
        <ThemedText type="subtitle" style={{ marginTop: 8 }}>
          Help & support
        </ThemedText>

        <View style={styles.chips}>
          {ISSUE_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setIssueType(t)}
              style={[styles.chip, issueType === t && { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
            >
              <ThemedText style={{ fontSize: 11, color: issueType === t ? theme.primary : theme.textSecondary }}>
                {t.replace(/_/g, ' ')}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe your issue (min 10 characters)"
          multiline
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />

        <Pressable
          disabled={create.isPending || description.trim().length < 10}
          onPress={() => create.mutate()}
          style={[styles.btn, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.btnText}>{create.isPending ? 'Submitting…' : 'Submit ticket'}</ThemedText>
        </Pressable>

        <ThemedText style={styles.sectionTitle}>Your tickets</ThemedText>
        <FlatList
          data={tickets}
          keyExtractor={(item: any) => String(item._id)}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">{ticketsQ.isLoading ? 'Loading…' : 'No tickets yet.'}</ThemedText>
          }
          renderItem={({ item }: { item: any }) => (
            <ThemedView type="backgroundElement" style={styles.ticketCard}>
              <ThemedText style={styles.ticketType}>{String(item.issueType ?? '').replace(/_/g, ' ')}</ThemedText>
              <ThemedText themeColor="textSecondary" numberOfLines={2}>
                {item.description}
              </ThemedText>
              <ThemedText style={styles.ticketStatus}>{item.status ?? 'OPEN'}</ThemedText>
            </ThemedView>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(228,190,177,0.35)' },
  input: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.35)',
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  btn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
  sectionTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', marginTop: Spacing.four, marginBottom: 8 },
  ticketCard: { padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(228,190,177,0.2)' },
  ticketType: { fontFamily: 'PlusJakartaSans_700Bold' },
  ticketStatus: { marginTop: 6, fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#ff5a00' },
});
