import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/queries/notifications';

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const q = useNotificationsQuery();
  const items = Array.isArray(q.data) ? q.data : [];
  const markOne = useMarkNotificationReadMutation();
  const markAll = useMarkAllNotificationsReadMutation();

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Notifications</ThemedText>
          <Pressable
            onPress={async () => {
              await markAll.mutateAsync();
            }}
            style={styles.markBtn}
          >
            <ThemedText style={styles.markText}>Mark all</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(n) => String(n._id)}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={{ paddingTop: Spacing.four }}>
              {q.isFetching ? 'Loading…' : 'No notifications.'}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={async () => {
                await markOne.mutateAsync(String(item._id));
              }}
            >
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.title}>{item.title ?? 'Notification'}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.body}>
                  {item.message ?? item.body ?? ''}
                </ThemedText>
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
  markBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,90,0,0.10)' },
  markText: { color: '#ff5a00', fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12 },
  card: {
    padding: Spacing.three,
    borderRadius: 16,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(228,190,177,0.25)',
  },
  title: { fontFamily: 'PlusJakartaSans_800ExtraBold', color: '#1a1c1c' },
  body: { marginTop: 4, fontSize: 12, lineHeight: 16 },
});

