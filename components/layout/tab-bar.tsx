import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
  const barBg = isDark ? '#1c1c1e' : '#ffffff';
  const addBg = isDark ? '#ffffff' : '#1c1c1e';
  const addIcon = isDark ? '#000000' : '#ffffff';

  return (
    <View
      style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }, { backgroundColor: barBg }]}>
      <View style={styles.bar}>

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

        {/* ── Add (Floating) ── */}
        <TouchableOpacity
          style={styles.addBtnWrap}
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.85}>
          <View style={[styles.addBtn, { backgroundColor: addBg, shadowColor: addBg }]}>
            <Icon as={Plus} size={28} color={addIcon} />
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
    zIndex: 50,
    elevation: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    minHeight: 60,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  addBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  addBtn: {
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
});
