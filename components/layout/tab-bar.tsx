import React, { useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { Home, ArrowRightLeft, Plus, Wallet, User, type LucideIcon } from 'lucide-react-native';

const PILL_WIDTH = 56;
const PILL_HEIGHT = 44;
const PILL_RADIUS = 22; // pill shape
const TAB_BAR_MARGIN = 16;
const TAB_COUNT = 5;

interface TabBarProps {
  onTabChange?: (name: string) => void;
  activeTab?: string;
}

export const TabBar = React.memo(function TabBar({ onTabChange, activeTab = 'index' }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = colorScheme === 'dark';

  const colors = useMemo(
    () => ({
      active: isDark ? '#ffffff' : '#1a1c1b',
      muted: isDark ? '#8e8e93' : '#9ca3af',
      addBg: isDark ? '#ffffff' : '#1c1c1e',
      addIcon: isDark ? '#000000' : '#ffffff',
      glassBg: isDark ? 'rgba(28,28,30,0.82)' : 'rgba(255,255,255,0.9)',
      glassBorder: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
      glassTint: (isDark ? 'dark' : 'light') as 'dark' | 'light',
      pillBg: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
    }),
    [isDark]
  );

  // Safe bottom offset
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 20;

  // Animation values
  const containerWidth = width - TAB_BAR_MARGIN * 2;
  const slotWidth = containerWidth / TAB_COUNT;

  const activeIndex = useMemo(() => {
    switch (activeTab) {
      case 'index':
        return 0;
      case 'transactions':
        return 1;
      case 'wallets':
        return 3;
      case 'profile':
        return 4;
      default:
        return 0;
    }
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => {
    const leftPosition = slotWidth * activeIndex + slotWidth / 2 - PILL_WIDTH / 2;
    return {
      transform: [{ translateX: withSpring(leftPosition, { damping: 30, stiffness: 400, mass: 0.8 }) }],
    };
  });

  const renderTab = useCallback(
    (tabName: string, IconComponent: LucideIcon) => {
      const isActive = activeTab === tabName;
      return (
        <TouchableOpacity
          key={tabName}
          style={styles.slot}
          onPress={() => onTabChange?.(tabName)}
          activeOpacity={0.7}>
          <Icon as={IconComponent} size={24} color={isActive ? colors.active : colors.muted} />
        </TouchableOpacity>
      );
    },
    [activeTab, onTabChange, colors.active, colors.muted]
  );

  return (
    <View style={[styles.outer, { bottom: bottomOffset }]}>
      {/* ── Glass capsule ── */}
      <BlurView
        style={[
          styles.capsule,
          {
            backgroundColor: colors.glassBg,
            borderColor: colors.glassBorder,
            borderWidth: 1,
            marginHorizontal: TAB_BAR_MARGIN,
          },
        ]}
        tint={colors.glassTint}
        intensity={Platform.OS === 'android' ? 35 : 45}
        {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' } : {})}>
        
        {/* Animated Pill Indicator */}
        <Animated.View
          style={[
            styles.pill,
            { backgroundColor: colors.pillBg },
            indicatorStyle,
          ]}
        />

        {renderTab('index', Home)}
        {renderTab('transactions', ArrowRightLeft)}

        {/* ── Add Action Button ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.85}>
          <View style={[styles.fab, { backgroundColor: colors.addBg }]}>
            <Icon as={Plus} size={24} color={colors.addIcon} />
          </View>
        </TouchableOpacity>

        {renderTab('wallets', Wallet)}
        {renderTab('profile', User)}
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 50,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 9999, 
    height: 65, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.12,
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
    left: 0, // Base position to apply translateX from
  },
  slot: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.15,
    elevation: 6,
  },
});
