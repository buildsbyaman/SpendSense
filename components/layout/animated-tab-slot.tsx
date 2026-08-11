import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  clamp,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { useAppState } from '@/hooks/useAppState';

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
import BackupScreen from '@/app/backup';

// Only the 4 tab bar tabs — determines horizontal slide order
const MAIN_TABS = ['index', 'transactions', 'wallets', 'profile'];

const MAIN_SCREENS: Record<string, React.ComponentType<{ isActive?: boolean }>> = {
  index: React.memo(IndexScreen),
  transactions: React.memo(TransactionsScreen),
  wallets: React.memo(WalletsScreen),
  profile: React.memo(ProfileScreen),
};

// Sub-screens that appear as vertical slide-up overlays
const SUB_SCREENS: Record<string, React.ComponentType<{ referrer?: string }>> = {
  analytics: React.memo(AnalyticsScreen),
  budgets: React.memo(BudgetsScreen),
  subscriptions: React.memo(SubscriptionsScreen),
  categories: React.memo(CategoriesScreen),
  currency: React.memo(CurrencyScreen),
  export: React.memo(ExportScreen),
  import: React.memo(ImportScreen),
  backup: React.memo(BackupScreen),
};

const SPRING_CONFIG = {
  damping: 26,
  stiffness: 170,
  mass: 0.9,
  overshootClamping: false,
};

// Sub-screen overlay animation — simple ease-out/in
const OVERLAY_IN = { duration: 300, easing: Easing.out(Easing.cubic) };
const OVERLAY_OUT = { duration: 240, easing: Easing.in(Easing.cubic) };

interface AnimatedTabSlotProps {
  activeTab: string;
}

export function AnimatedTabSlot({ activeTab }: AnimatedTabSlotProps) {
  const { navigate, lastParams } = useTabNavigation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [layoutWidth, setLayoutWidth] = useState(windowWidth);
  const [layoutHeight, setLayoutHeight] = useState(windowHeight);

  const activeWidth = layoutWidth > 0 ? layoutWidth : windowWidth;
  const activeHeight = layoutHeight > 0 ? layoutHeight : windowHeight;

  const activeTabRef = useRef(activeTab);
  const activeWidthRef = useRef(activeWidth);
  const activeHeightRef = useRef(activeHeight);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  useEffect(() => {
    activeWidthRef.current = activeWidth;
    activeHeightRef.current = activeHeight;
  }, [activeWidth, activeHeight]);

  // Horizontal row translation for main tabs
  const translateX = useSharedValue(0);
  const activeTabIndex = useSharedValue(0);

  const gestureNavigatedTabs = useRef(new Set<string>());
  const handleGestureNavigation = useCallback((tab: string) => {
    gestureNavigatedTabs.current.add(tab);
    navigateRef.current(tab);
  }, []);

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
      // Current position in tabs — computed from the actual row offset (which
      // includes startX), so mid-animation swipes resolve to the right target.
      const currentTabs = clamp(-translateX.value / activeWidth, 0, MAIN_TABS.length - 1);
      let nextIndex: number;
      if (e.velocityX < -400) {
        nextIndex = Math.min(MAIN_TABS.length - 1, startIdx + 1);
      } else if (e.velocityX > 400) {
        nextIndex = Math.max(0, startIdx - 1);
      } else {
        nextIndex = clamp(Math.round(currentTabs), 0, MAIN_TABS.length - 1);
      }
      activeTabIndex.value = nextIndex;
      translateX.value = withSpring(-nextIndex * activeWidth, SPRING_CONFIG);
      if (nextIndex !== startIdx) {
        runOnJS(handleGestureNavigation)(MAIN_TABS[nextIndex]);
      }
    })
    .onFinalize((_, success) => {
      // Safety net: if the gesture was cancelled and onEnd never settled the
      // row (e.g. a competing scroll view steals the touch), spring to the
      // nearest snapped position so it can never stay stuck in between tabs.
      if (!success) {
        const width = activeWidth;
        const currentTabs = clamp(-translateX.value / width, 0, MAIN_TABS.length - 1);
        const nearest = clamp(Math.round(currentTabs), 0, MAIN_TABS.length - 1);
        activeTabIndex.value = nearest;
        translateX.value = withSpring(-nearest * width, SPRING_CONFIG);
      }
    });

  // Vertical overlay for sub-screens
  const overlayY = useSharedValue(activeHeight);
  const [activeSubScreen, setActiveSubScreen] = useState<string | null>(null);
  const prevActiveTab = useRef(activeTab);
  const rowFade = useSharedValue(1);

  useEffect(() => {
    const isMainTab = MAIN_TABS.includes(activeTab);
    const prevTabName = prevActiveTab.current;
    const wasSubScreen = !MAIN_TABS.includes(prevTabName);
    const tabChanged = prevTabName !== activeTab;
    prevActiveTab.current = activeTab;
    const width = activeWidthRef.current;
    const height = activeHeightRef.current;

    if (isMainTab) {
      if (gestureNavigatedTabs.current.has(activeTab)) {
        gestureNavigatedTabs.current.delete(activeTab);
        return;
      } else {
        gestureNavigatedTabs.current.clear();
      }

      const index = MAIN_TABS.indexOf(activeTab);
      activeTabIndex.value = index;

      if (tabChanged) {
        if (MAIN_TABS.includes(prevTabName)) {
          const prevIndex = MAIN_TABS.indexOf(prevTabName);
          const distance = Math.abs(index - prevIndex);
          if (distance > 1) {
            // Multi-tab jump — snap straight to the target so intermediate
            // screens never sweep through the viewport, then fade it in.
            translateX.value = -index * width;
            rowFade.value = 0;
            rowFade.value = withTiming(1, { duration: 280 });
          } else {
            // Adjacent tab — slide directly to the clicked tab.
            rowFade.value = 1;
            translateX.value = withSpring(-index * width, SPRING_CONFIG);
          }
        } else {
          // Coming back from a sub-screen — row is already at the right spot.
          rowFade.value = 1;
          translateX.value = -index * width;
        }

        // If coming back from a sub-screen, slide the overlay away
        if (wasSubScreen) {
          overlayY.value = withTiming(height, OVERLAY_OUT, (finished) => {
            if (finished) {
              runOnJS(setActiveSubScreen)(null);
            }
          });
        }
      }
    } else {
      // Sub-screen — show overlay offscreen, then slide up after 1 frame
      // so React finishes mounting the component before the animation starts.
      setActiveSubScreen(activeTab);
      overlayY.value = height;
      overlayY.value = withDelay(16, withTiming(0, OVERLAY_IN));
    }
  }, [activeTab]);

  useAppState(undefined, () => {
    const tab = activeTabRef.current;
    const width = activeWidthRef.current;
    const height = activeHeightRef.current;
    if (MAIN_TABS.includes(tab)) {
      const index = MAIN_TABS.indexOf(tab);
      activeTabIndex.value = index;
      translateX.value = withSpring(-index * width, SPRING_CONFIG);
      overlayY.value = height;
      setActiveSubScreen(null);
    } else {
      overlayY.value = 0;
    }
  });

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setLayoutWidth((prev) => (prev !== w ? w : prev));
      setLayoutHeight((prev) => (prev !== h ? h : prev));
    }
  }, []);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: rowFade.value,
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
        <Animated.View style={[styles.row, { width: activeWidth * MAIN_TABS.length }, rowStyle]}>
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
          <Animated.View style={[StyleSheet.absoluteFill, overlayStyle, styles.overlay]}>
            <SubScreen referrer={lastParams.current.referrer} />
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
  overlay: {
    zIndex: 4,
    // Force its own compositing layer so the screens below never re-render
    // during the slide animation (avoids a visible flutter on Android).
    elevation: 4,
  },
});
