import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Matches tab bar height in `(tabs)/_layout` via `app-tabs` — use for scroll bottom padding */
export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  const androidBottomInset = Math.max(insets.bottom, 8);
  return Platform.OS === 'ios' ? 50 + insets.bottom : 62 + androidBottomInset;
}
