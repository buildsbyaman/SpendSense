import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import { Home, ArrowRightLeft, Plus, Wallet, User } from 'lucide-react-native';

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
  const glassTint = isDark ? 'dark' : 'light' as const;

  // Safe bottom offset so the capsule floats nicely above the home bar / screen edge
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 20;

  return (
    <View style={[styles.outer, { bottom: bottomOffset }]}>
      {/* ── Glass capsule ── */}
      <BlurView
        style={[
          styles.capsule,
          { backgroundColor: glassBg, borderColor: glassBorder },
        ]}
        tint={glassTint}
        intensity={Platform.OS === 'android' ? 35 : 45}
        {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' } : {})}>
        {/* ── Home ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('index')}
          activeOpacity={0.7}>
          <Icon as={Home} size={24} color={activeTab === 'index' ? active : muted} />
        </TouchableOpacity>

        {/* ── Transactions ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('transactions')}
          activeOpacity={0.7}>
          <Icon as={ArrowRightLeft} size={24} color={activeTab === 'transactions' ? active : muted} />
        </TouchableOpacity>

        {/* ── Add Action Button ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.85}>
          <View style={[styles.fab, { backgroundColor: addBg }]}>
            <Icon as={Plus} size={24} color={addIcon} />
          </View>
        </TouchableOpacity>

        {/* ── Wallets ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('wallets')}
          activeOpacity={0.7}>
          <Icon as={Wallet} size={24} color={activeTab === 'wallets' ? active : muted} />
        </TouchableOpacity>

        {/* ── Profile ── */}
        <TouchableOpacity
          style={styles.slot}
          onPress={() => onTabChange?.('profile')}
          activeOpacity={0.7}>
          <Icon as={User} size={24} color={activeTab === 'profile' ? active : muted} />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 50,
    elevation: 50,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.12,
    elevation: 12,
    paddingHorizontal: 8,
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
