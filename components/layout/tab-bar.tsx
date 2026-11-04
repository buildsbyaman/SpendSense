import React, { useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { Home, ArrowRightLeft, Plus, Wallet, User, type LucideIcon } from 'lucide-react-native';

interface TabBarProps {
  onTabChange?: (name: string) => void;
  activeTab?: string;
}

export const TabBar = React.memo(function TabBar({ onTabChange, activeTab = 'index' }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Bottom safe area padding
  const bottomPadding = Math.max(insets.bottom, 12);

  const renderTab = useCallback(
    (tabName: string, IconComponent: LucideIcon) => {
      const isActive = activeTab === tabName;
      return (
        <TouchableOpacity
          key={tabName}
          style={styles.slot}
          onPress={() => onTabChange?.(tabName)}
          activeOpacity={0.7}>
          <Icon as={IconComponent} size={22} color={isActive ? '#FFFFFF' : '#71717A'} />
          <View style={[styles.activeDot, { opacity: isActive ? 1 : 0 }]} />
        </TouchableOpacity>
      );
    },
    [activeTab, onTabChange]
  );

  return (
    <View style={[styles.bar, { paddingBottom: bottomPadding }]}>
      {renderTab('index', Home)}
      {renderTab('transactions', ArrowRightLeft)}

      {/* ── CRED-Inspired Central Action Button ── */}
      <View style={styles.slot}>
        <TouchableOpacity
          style={styles.centerButtonOuter}
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.85}>
          <View style={styles.centerButtonInner}>
            <Icon as={Plus} size={22} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        </TouchableOpacity>
      </View>

      {renderTab('wallets', Wallet)}
      {renderTab('profile', User)}
    </View>
  );
});

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0D0D0E',
    borderTopWidth: 1,
    borderTopColor: '#1F1F24',
    paddingTop: 10,
    zIndex: 50,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  centerButtonOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#161619',
    borderWidth: 1.5,
    borderColor: '#2E2E34',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222228',
    borderWidth: 1,
    borderColor: '#383842',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
