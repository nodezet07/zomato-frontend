import { useRef, useState } from 'react';
import { Dimensions, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SLIDES = [
  {
    title: 'Food you love',
    subtitle: 'Discover restaurants and dishes near you with QuickBite.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Fast delivery',
    subtitle: 'Track your order live from kitchen to your doorstep.',
    image: 'https://images.unsplash.com/photo-1526367790999-015a178ea6ae?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'Secure payments',
    subtitle: 'Pay with COD or online. Rate orders and save favorites.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=80',
  },
];

export default function OnboardingCarouselScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const width = Dimensions.get('window').width;

  const isLast = index === SLIDES.length - 1;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => `slide-${i}`}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
          }}
          renderItem={({ item }) => (
            <View style={{ width, paddingHorizontal: Spacing.four }}>
              <Image source={{ uri: item.image }} style={styles.hero} />
              <ThemedText type="subtitle" style={styles.title}>
                {item.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                {item.subtitle}
              </ThemedText>
            </View>
          )}
        />

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && { backgroundColor: theme.primary, width: 18 }]}
            />
          ))}
        </View>

        <View style={styles.footer}>
          {!isLast ? (
            <Pressable onPress={() => router.replace('/(onboarding)/location')}>
              <ThemedText style={{ color: theme.textSecondary, fontFamily: 'PlusJakartaSans_600SemiBold' }}>
                Skip
              </ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            onPress={() => {
              if (isLast) {
                router.replace('/(onboarding)/location');
                return;
              }
              listRef.current?.scrollToIndex({ index: index + 1, animated: true });
            }}
            style={[styles.nextBtn, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.nextText}>{isLast ? 'Set location' : 'Next'}</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between', paddingBottom: Spacing.four },
  hero: { width: '100%', height: 320, borderRadius: 20, marginTop: Spacing.two },
  title: { marginTop: Spacing.four },
  subtitle: { marginTop: Spacing.two, lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.three },
  dot: { width: 8, height: 8, borderRadius: 99, backgroundColor: 'rgba(228,190,177,0.5)' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
  nextBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextText: { color: '#fff', fontFamily: 'PlusJakartaSans_800ExtraBold' },
});
