import { apiFetch } from '@/lib/apiFetch';

export async function fetchNotifications() {
  const body = await apiFetch('/users/notifications');
  return (body as any)?.data?.notifications ?? [];
}

export async function markNotificationRead(notificationId: string) {
  return apiFetch(`/users/notifications/read/${notificationId}`, { method: 'PATCH' });
}

export async function markAllNotificationsRead() {
  return apiFetch('/users/notifications/read-all', { method: 'PATCH' });
}

export async function registerDeviceToken(input: { token: string; platform: 'ios' | 'android' }) {
  const body = await apiFetch('/notifications/device-token', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return (body as any)?.data ?? body;
}

