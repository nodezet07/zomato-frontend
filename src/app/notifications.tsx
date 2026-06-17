import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '@/hooks/queries/notifications';
import { openNotificationTarget } from '@/lib/notificationNavigation';
import type { AppNotification } from '@/services/notifications';

function formatTimeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const theme = useTheme();
  const isOrder = item.notificationType === 'ORDER';
  const isClickable = Boolean(
    (item.redirectType === 'ORDER' || item.redirectType === 'RESTAURANT' || isOrder) &&
      item.redirectId,
  );

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        !item.isRead && { backgroundColor: 'rgba(255,90,0,0.06)' },
        { borderBottomColor: 'rgba(228,190,177,0.35)' },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isOrder ? 'rgba(255,90,0,0.12)' : theme.backgroundSelected }]}>
        <Ionicons
          name={isOrder ? 'receipt-outline' : 'notifications-outline'}
          size={20}
          color={isOrder ? theme.primary : theme.textSecondary}
        />
      </View>
      <View style={styles.rowBody}>
        <ThemedText style={[styles.rowTitle, !item.isRead && styles.unreadTitle]}>
          {item.title ?? 'Notification'}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body} numberOfLines={3}>
          {item.message ?? item.body ?? ''}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.time}>
          {item.sentAt ? formatTimeAgo(item.sentAt) : ''}
        </ThemedText>
      </View>
      {isClickable ? (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} style={styles.chevron} />
      ) : null}
      {!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const q = useNotificationsQuery();
  const items = Array.isArray(q.data) ? q.data : [];
  const markOne = useMarkNotificationReadMutation();
  const markAll = useMarkAllNotificationsReadMutation();
  const unread = items.filter((n) => !n.isRead).length;

  function onOpen(item: AppNotification) {
    if (!item.isRead) {
      markOne.mutate(String(item._id));
    }
    openNotificationTarget(item);
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">Notifications</ThemedText>
          {unread > 0 ? (
            <Pressable
              onPress={() => markAll.mutate()}
              disabled={markAll.isPending}
              style={styles.markBtn}
            >
              <ThemedText style={styles.markText}>Mark all</ThemedText>
            </Pressable>
          ) : (
            <View style={{ width: 72 }} />
          )}
        </View>

        <FlatList
          data={items}
          keyExtractor={(n) => String(n._id)}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={40} color={theme.textSecondary} />
              <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
                Order updates and offers will appear here.
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => <NotificationRow item={item} onPress={() => onOpen(item)} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { fontFamily: 'PlusJakartaSans_700Bold', color: '#1a1c1c', fontSize: 14 },
  unreadTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold' },
  body: { marginTop: 4, fontSize: 12, lineHeight: 16 },
  time: { marginTop: 6, fontSize: 11 },
  chevron: { marginTop: 10 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    right: 4,
    top: 18,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: Spacing.five * 2,
    gap: Spacing.two,
  },
  emptyTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 16 },
  emptyBody: { textAlign: 'center', fontSize: 13, paddingHorizontal: Spacing.four },
});
