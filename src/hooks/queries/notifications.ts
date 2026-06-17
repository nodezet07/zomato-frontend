import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '@/services/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: fetchNotifications,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

