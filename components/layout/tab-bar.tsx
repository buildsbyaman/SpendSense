import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { Home, ArrowRightLeft, Plus, Wallet, User, type LucideIcon } from 'lucide-react-native';

const PILL_WIDTH = 56;
const PILL_HEIGHT = 44;
const PILL_RADIUS = 14;

interface TabBarProps {
  onTabChange?: (name: string) => void;
  activeTab?: string;
}

export function TabBar({ onTabChange, activeTab = 'index' }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Colors
  const active = isDark ? '#ffffff' : '#1a1c1b';
  const muted = isDark ? '#8e8e93' : '#9ca3af';
  const addBg = isDark ? '#ffffff' : '#1c1c1e';
  const addIcon = isDark ? '#000000' : '#ffffff';

  // Glass capsule
  const glassBg = isDark ? 'rgba(28,28,30,0.82)' : 'rgba(255,255,255,0.9)';
  const glassBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
  const glassTint = (isDark ? 'dark' : 'light') as 'dark' | 'light';

  // Pill indicator
  const pillBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';

  // Safe bottom offset
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;

  const renderTab = (tabName: string, IconComponent: LucideIcon) => {
    const isActive = activeTab === tabName;
    return (
      <TouchableOpacity
        key={tabName}
        style={styles.slot}
        onPress={() => onTabChange?.(tabName)}
        activeOpacity={0.7}>
        {isActive && <View style={[styles.pill, { backgroundColor: pillBg }]} />}
        <Icon as={IconComponent} size={24} color={isActive ? active : muted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.outer, { bottom: 0 }]}>
      {/* ── Glass capsule ── */}
      <BlurView
        style={[
          styles.capsule,
          {
            backgroundColor: glassBg,
            borderTopColor: glassBorder,
            paddingBottom: bottomOffset - 12,
          },
        ]}
        tint={glassTint}
        intensity={Platform.OS === 'android' ? 35 : 45}
        {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' } : {})}>
        {renderTab('index', Home)}
        {renderTab('transactions', ArrowRightLeft)}

        {/* ── Add Action Button ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.85}>
          <View style={[styles.fab, { backgroundColor: addBg }]}>
            <Icon as={Plus} size={24} color={addIcon} />
          </View>
        </TouchableOpacity>

        {renderTab('wallets', Wallet)}
        {renderTab('profile', User)}
      </BlurView>
    </View>
  );
}

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
    borderRadius: 0,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.12,
    elevation: 12,
    paddingHorizontal: 8,
  },
  pill: {
    position: 'absolute',
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_RADIUS,
  },
  slot: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.15,
    elevation: 6,
  },
});
