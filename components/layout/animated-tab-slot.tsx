import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, clamp, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTabNavigation } from '@/context/TabNavigationContext';

import IndexScreen from '@/app/(tabs)/index';
import TransactionsScreen from '@/app/(tabs)/transactions';
import WalletsScreen from '@/app/(tabs)/wallets';
import ProfileScreen from '@/app/(tabs)/profile';

// Sub-screens shown as overlays (not in the tab bar row)
import AnalyticsScreen from '@/app/(tabs)/analytics';
import BudgetsScreen from '@/app/(tabs)/budgets';
import SubscriptionsScreen from '@/app/(tabs)/subscriptions';
import CategoriesScreen from '@/app/(tabs)/categories';
import CurrencyScreen from '@/app/currency';
import ExportScreen from '@/app/(tabs)/export';
import ImportScreen from '@/app/(tabs)/import';

// Only the 4 tab bar tabs — determines horizontal slide order
const MAIN_TABS = ['index', 'transactions', 'wallets', 'profile'];

const MAIN_SCREENS: Record<string, React.ComponentType<{ isActive?: boolean }>> = {
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
  currency: CurrencyScreen,
  export: ExportScreen,
  import: ImportScreen,
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
  const { navigate } = useTabNavigation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState(windowWidth);
  const [layoutHeight, setLayoutHeight] = useState(windowHeight);

  useEffect(() => {
    setLayoutWidth(windowWidth);
    setLayoutHeight(windowHeight);
  }, [windowWidth, windowHeight]);

  const activeWidth = layoutWidth > 0 ? layoutWidth : windowWidth;
  const activeHeight = layoutHeight > 0 ? layoutHeight : windowHeight;

  // Horizontal row translation for main tabs
  const translateX = useSharedValue(0);
  const activeTabIndex = useSharedValue(0);

  // Swipe gesture
  const startX = useSharedValue(0);
  const isMainTab = MAIN_TABS.includes(activeTab);

  const pan = Gesture.Pan()
    .enabled(isMainTab)
    .activeOffsetX([-12, 12])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const max = -(MAIN_TABS.length - 1) * activeWidth;
      translateX.value = clamp(startX.value + e.translationX, max, 0);
    })
    .onEnd((e) => {
      const startIdx = clamp(activeTabIndex.value, 0, MAIN_TABS.length - 1);
      const offsetTabs = -e.translationX / activeWidth;
      let nextIndex: number;
      if (e.velocityX < -400) {
        nextIndex = Math.floor(startIdx + offsetTabs) + 1;
      } else if (e.velocityX > 400) {
        nextIndex = Math.ceil(startIdx + offsetTabs) - 1;
      } else {
        nextIndex = Math.round(startIdx + offsetTabs);
      }
      nextIndex = Math.min(MAIN_TABS.length - 1, Math.max(0, nextIndex));
      translateX.value = withSpring(-nextIndex * activeWidth, SPRING_CONFIG);
      runOnJS(navigate)(MAIN_TABS[nextIndex]);
    });

  // Vertical overlay for sub-screens
  const overlayY = useSharedValue(activeHeight);
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
  const prevActiveTab = useRef(activeTab);
  const clearSubScreenTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clean up any pending timeout from previous effect
    if (clearSubScreenTimeout.current) {
      clearTimeout(clearSubScreenTimeout.current);
      clearSubScreenTimeout.current = null;
    }

    const isMainTab = MAIN_TABS.includes(activeTab);
    const wasSubScreen = !MAIN_TABS.includes(prevActiveTab.current);
    prevActiveTab.current = activeTab;

    if (isMainTab) {
      // Slide main row to the correct tab
      const index = MAIN_TABS.indexOf(activeTab);
      activeTabIndex.value = index;
      translateX.value = withSpring(-index * activeWidth, SPRING_CONFIG);

      // If coming back from a sub-screen, slide the overlay away
      if (wasSubScreen) {
        overlayY.value = withSpring(activeHeight, {
          ...SPRING_CONFIG,
          damping: 32,
        });
        clearSubScreenTimeout.current = setTimeout(() => setActiveSubScreen(null), 400);
      }
    } else {
      // Sub-screen — show overlay sliding up from bottom
      setActiveSubScreen(activeTab);
      overlayY.value = activeHeight;
      overlayY.value = withSpring(0, SPRING_CONFIG);
    }

    return () => {
      if (clearSubScreenTimeout.current) {
        clearTimeout(clearSubScreenTimeout.current);
      }
    };
  }, [activeTab, activeWidth, activeHeight]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setLayoutWidth(w);
      setLayoutHeight(h);
    }
  }, []);

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: overlayY.value }],
  }));

  const SubScreen = activeSubScreen ? SUB_SCREENS[activeSubScreen] : null;

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container} onLayout={handleLayout}>
      {/* Horizontal main tab row */}
      <Animated.View
        style={[
          styles.row,
          { width: activeWidth * MAIN_TABS.length },
          rowStyle,
        ]}>
        {MAIN_TABS.map((tabName) => {
          const Screen = MAIN_SCREENS[tabName];
          return (
            <View key={tabName} style={[styles.screen, { width: activeWidth }]}>
              <Screen isActive={activeTab === tabName} />
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
    </GestureDetector>
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
  },
  screen: {
    flex: 1,
  },
});
