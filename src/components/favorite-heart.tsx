import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { useToggleFavoriteMutation } from '@/hooks/queries/favorites';
import { useFavoritesStore } from '@/stores/favoritesStore';

type Props = {
  restaurantId: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  variant?: 'overlay' | 'header';
};

export function FavoriteHeart({ restaurantId, style, size = 22, variant = 'overlay' }: Props) {
  const theme = useTheme();
  const ids = useFavoritesStore((s) => s.ids);
  const toggleLocal = useFavoritesStore((s) => s.toggleLocal);
  const toggle = useToggleFavoriteMutation();
  const isFavorite = ids.has(restaurantId);

  const onPress = () => {
    const had = ids.has(restaurantId);
    toggleLocal(restaurantId);
    toggle.mutate(
      { restaurantId, has: had },
      { onError: () => toggleLocal(restaurantId) },
    );
  };

  const color =
    variant === 'overlay'
      ? isFavorite
        ? theme.primary
        : '#fff'
      : isFavorite
        ? theme.primary
        : theme.text;

  return (
    <Pressable
      onPress={onPress}
      style={[variant === 'overlay' ? styles.overlayBtn : styles.headerBtn, style]}
      hitSlop={8}
    >
      <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
