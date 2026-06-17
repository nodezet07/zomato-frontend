import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

const TAB_LABEL_FONT = 'PlusJakartaSans_600SemiBold';

export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const androidBottomInset = Math.max(insets.bottom, 8);
  const tabBarHeight = Platform.OS === 'ios' ? 50 + insets.bottom : 62 + androidBottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 16,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : androidBottomInset,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: TAB_LABEL_FONT,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Fav',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
