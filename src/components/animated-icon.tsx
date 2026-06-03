import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 850;
const DOTS_COLS = 10;
const DOTS_ROWS = 18;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: INITIAL_SCALE_FACTOR }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  return (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashRoot}
    >
      <View style={styles.pattern}>
        {Array.from({ length: DOTS_COLS * DOTS_ROWS }).map((_, idx) => (
          <View key={idx} style={styles.patternDot} />
        ))}
      </View>

      <View style={styles.center}>
        <View style={styles.logoCard}>
          <View style={styles.logo}>
            <Animated.Image
              source={require('@/assets/flowimages/stitch_quickbite_food_delivery_app_user_panel/stitch_quickbite_food_delivery_app_user_panel/quickbite_fork_and_flame_logo/screen.png')}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.tagline}>
          <Animated.Text style={styles.brandText}>QuickBite</Animated.Text>
          <Animated.Text style={styles.subText}>Delivered Fresh, Delivered Fast</Animated.Text>
        </View>
      </View>

      <View style={styles.dotsRow}>
        <View style={[styles.dot, { opacity: 1 }]} />
        <View style={[styles.dot, { opacity: 0.85 }]} />
        <View style={[styles.dot, { opacity: 0.7 }]} />
      </View>

      <View style={styles.bottomGlow} />
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Animated.Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Animated.Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashRoot: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ff5a00',
    zIndex: 1000,
    overflow: 'hidden',
  },
  pattern: {
    ...StyleSheet.absoluteFill,
    opacity: 0.22,
    paddingTop: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  patternDot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: '#ffffff',
    opacity: 0.25,
    marginBottom: 26,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 22,
  },
  logo: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  logoImg: { width: '100%', height: '100%' },
  tagline: { alignItems: 'center' },
  brandText: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    marginTop: 6,
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    maxWidth: 260,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#ffffff',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    position: 'absolute',
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  backgroundSolidColor: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ff5a00',
    zIndex: 1000,
  },
});
