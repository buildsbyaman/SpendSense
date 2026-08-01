import React, { useEffect, useState, useRef } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import IndexScreen from '@/app/(tabs)/index';
import TransactionsScreen from '@/app/(tabs)/transactions';
import WalletsScreen from '@/app/(tabs)/wallets';
import ProfileScreen from '@/app/(tabs)/profile';

// Sub-screens shown as overlays (not in the tab bar row)
import AnalyticsScreen from '@/app/(tabs)/analytics';
import BudgetsScreen from '@/app/(tabs)/budgets';
import SubscriptionsScreen from '@/app/(tabs)/subscriptions';
import CategoriesScreen from '@/app/(tabs)/categories';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Only the 4 tab bar tabs — determines horizontal slide order
const MAIN_TABS = ['index', 'transactions', 'wallets', 'profile'];

const MAIN_SCREENS: Record<string, React.ComponentType> = {
  index: IndexScreen,
  transactions: TransactionsScreen,
  wallets: WalletsScreen,
  profile: ProfileScreen,
};

// Sub-screens that appear as vertical slide-up overlays
const SUB_SCREENS: Record<string, React.ComponentType> = {
  analytics: AnalyticsScreen,
  budgets: BudgetsScreen,
  subscriptions: SubscriptionsScreen,
  categories: CategoriesScreen,
};

const SPRING_CONFIG = {
  damping: 28,
  stiffness: 280,
  mass: 0.7,
  overshootClamping: false,
};

interface AnimatedTabSlotProps {
  activeTab: string;
}

export function AnimatedTabSlot({ activeTab }: AnimatedTabSlotProps) {
  // Horizontal row translation for main tabs
  const translateX = useSharedValue(0);

  // Vertical overlay for sub-screens
  const overlayY = useSharedValue(SCREEN_HEIGHT);
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
  const prevActiveTab = useRef(activeTab);

  useEffect(() => {
    const isMainTab = MAIN_TABS.includes(activeTab);
    const wasSubScreen = !MAIN_TABS.includes(prevActiveTab.current);
    prevActiveTab.current = activeTab;

    if (isMainTab) {
      // Slide main row to the correct tab
      const index = MAIN_TABS.indexOf(activeTab);
      translateX.value = withSpring(-index * SCREEN_WIDTH, SPRING_CONFIG);

      // If coming back from a sub-screen, slide the overlay away
      if (wasSubScreen) {
        overlayY.value = withSpring(SCREEN_HEIGHT, {
          ...SPRING_CONFIG,
          damping: 32,
        });
        // Delay clearing the sub-screen until animation completes
        setTimeout(() => setActiveSubScreen(null), 400);
      }
    } else {
      // Sub-screen — show overlay sliding up from bottom
      setActiveSubScreen(activeTab);
      overlayY.value = SCREEN_HEIGHT;
      overlayY.value = withSpring(0, SPRING_CONFIG);
    }
  }, [activeTab]);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: overlayY.value }],
  }));

  const SubScreen = activeSubScreen ? SUB_SCREENS[activeSubScreen] : null;

  return (
    <View style={styles.container}>
      {/* Horizontal main tab row */}
      <Animated.View style={[styles.row, rowStyle]}>
        {MAIN_TABS.map((tabName) => {
          const Screen = MAIN_SCREENS[tabName];
          return (
            <View key={tabName} style={styles.screen}>
              <Screen />
            </View>
          );
        })}
      </Animated.View>

      {/* Sub-screen overlay */}
      {SubScreen && (
        <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
          <SubScreen />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    width: SCREEN_WIDTH * MAIN_TABS.length,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
