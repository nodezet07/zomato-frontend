import AppTabs from '@/components/app-tabs';
import { useSyncFavorites } from '@/hooks/use-sync-favorites';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function TabsLayout() {
  useSyncFavorites();
  usePushNotifications();
  return <AppTabs />;
}

