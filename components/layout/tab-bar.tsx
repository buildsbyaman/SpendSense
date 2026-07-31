import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { LayoutDashboard, ArrowUpDown, Plus, Cog, Wallet } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Snappy spring with slight bounce — feels like iOS
const SPRING = { damping: 22, stiffness: 260, mass: 0.8 };

// All items (tabs + add button) are the same size for even distribution
const ITEM_SIZE = 48;
const BAR_PADDING = 6;
const TOTAL_ITEMS = 5; // 4 tabs + 1 add button

// Maps tab name → its visual slot in the row (0–4)
// Slot 2 is the "+" add button (not a tab)
const TAB_SLOT: Record<string, number> = {
  index: 0,
  transactions: 1,
  // slot 2 = add button
  wallets: 3,
  profile: 4,
};

interface TabBarProps {
  onTabChange?: (name: string) => void;
  activeTab?: string;
}

export function TabBar({ onTabChange, activeTab = 'index' }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const pillX = useSharedValue(BAR_PADDING);
  const [ready, setReady] = useState(false);

  // Pure math: given bar width, compute the X of a slot
  // Subtract 2 for the 1px left and right borders on the bar!
  const slotX = useCallback(
    (slot: number, barWidth: number) => {
      const contentWidth = barWidth - BAR_PADDING * 2 - 2; 
      const totalItems = TOTAL_ITEMS * ITEM_SIZE;
      const gap = (contentWidth - totalItems) / (TOTAL_ITEMS - 1);
      return BAR_PADDING + slot * (ITEM_SIZE + gap);
    },
    []
  );

  // Capture bar width on first layout, snap pill without animation
  const barWidthRef = React.useRef(0);
  const handleBarLayout = useCallback(
    (e: any) => {
      const w = e.nativeEvent.layout.width;
      barWidthRef.current = w;
      const slot = TAB_SLOT[activeTab] ?? 0;
      if (!ready) {
        // First render — teleport (no animation)
        pillX.value = slotX(slot, w);
        setReady(true);
      }
    },
    [activeTab, ready, slotX]
  );

  // Animate pill when active tab changes
  useEffect(() => {
    const w = barWidthRef.current;
    if (w === 0) return;
    const slot = TAB_SLOT[activeTab] ?? 0;
    pillX.value = withSpring(slotX(slot, w), SPRING);
  }, [activeTab, slotX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  // Colors
  const active = isDark ? '#ffffff' : '#1a1c1b';
  const muted = isDark ? '#555560' : '#9b9b9b';
  const pillBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)';
  const barBg = isDark ? 'rgba(28,28,32,0.96)' : 'rgba(255,255,255,0.96)';
  const barBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const addBg = isDark ? '#ffffff' : '#1a1c1b';
  const addIcon = isDark ? '#000000' : '#ffffff';

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      pointerEvents="box-none">
      <View
        style={[styles.bar, { backgroundColor: barBg, borderColor: barBorder }]}
        onLayout={handleBarLayout}>

        {/* ── Sliding pill ── */}
        {ready && (
          <Animated.View
            style={[styles.pill, pillStyle, { backgroundColor: pillBg }]}
            pointerEvents="none"
          />
        )}

        {/* ── Home ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('index')}
          activeOpacity={0.7}>
          <Icon as={LayoutDashboard} size={22} color={activeTab === 'index' ? active : muted} />
        </TouchableOpacity>

        {/* ── Transactions ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('transactions')}
          activeOpacity={0.7}>
          <Icon as={ArrowUpDown} size={22} color={activeTab === 'transactions' ? active : muted} />
        </TouchableOpacity>

        {/* ── Add ── */}
        <TouchableOpacity
          style={[styles.slot, styles.addBtn, { backgroundColor: addBg, shadowColor: addBg }]}
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.85}>
          <Icon as={Plus} size={24} color={addIcon} />
        </TouchableOpacity>

        {/* ── Wallets ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('wallets')}
          activeOpacity={0.7}>
          <Icon as={Wallet} size={22} color={activeTab === 'wallets' ? active : muted} />
        </TouchableOpacity>

        {/* ── Settings ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('profile')}
          activeOpacity={0.7}>
          <Icon as={Cog} size={22} color={activeTab === 'profile' ? active : muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bar: {
    marginHorizontal: 16,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: BAR_PADDING,
    paddingVertical: BAR_PADDING,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  pill: {
    position: 'absolute',
    top: BAR_PADDING,
    left: 0, // translateX handles real position
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 999,
  },
  slot: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    zIndex: 1,
  },
  addBtn: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
