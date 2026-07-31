import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Icon } from '@/components/ui/icon';
import {
  LayoutDashboard,
  ArrowUpDown,
  Plus,
  Cog,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface TabDef {
  name: string;
  icon: LucideIcon;
}

const tabs: TabDef[] = [
  { name: 'index', icon: LayoutDashboard },
  { name: 'transactions', icon: ArrowUpDown },
  { name: 'wallets', icon: Wallet },
  { name: 'profile', icon: Cog },
];

interface TabBarProps {
  onTabChange?: (name: string) => void;
  activeTab?: string;
}

export function TabBar({ onTabChange, activeTab = 'index' }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [layouts, setLayouts] = useState<Record<string, { x: number; y: number }>>({});
  const indicatorX = useSharedValue(0);
  const indicatorY = useSharedValue(0);

  const handleLayout = useCallback((name: string, layout: any) => {
    setLayouts((prev) => ({ ...prev, [name]: layout }));
  }, []);

  const handleTabPress = useCallback(
    (name: string) => {
      onTabChange?.(name);
    },
    [onTabChange]
  );

  useEffect(() => {
    if (layouts[activeTab]) {
      indicatorX.value = layouts[activeTab].x;
      indicatorY.value = layouts[activeTab].y;
    }
  }, [activeTab, layouts]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(indicatorX.value, {
          damping: 20,
          stiffness: 250,
          mass: 0.8,
        }),
      },
      {
        translateY: withSpring(indicatorY.value, {
          damping: 20,
          stiffness: 250,
          mass: 0.8,
        }),
      },
    ],
    backgroundColor: withTiming(isDark ? '#4a4a52' : '#ffffff', { duration: 300 }),
  }));

  return (
    <View
      className="absolute bottom-0 left-0 right-0 w-full"
      style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      pointerEvents="box-none">
      {/* Main Tab Bar */}
      <View className="mx-4 bg-surface rounded-full shadow-md flex-row items-center justify-between px-2 py-2 border border-black/5 dark:border-white/5 relative">
        {/* Animated Background Indicator */}
        {Object.keys(layouts).length > 0 && (
          <Animated.View
            className="absolute top-0 left-0 h-12 w-12 rounded-full z-0"
            style={[
              indicatorStyle,
              {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}
          />
        )}

        {/* Tab: Home */}
        <TouchableOpacity
          className="items-center justify-center h-12 w-12 rounded-full z-10"
          onPress={() => handleTabPress('index')}
          activeOpacity={0.7}
          onLayout={(e) => handleLayout('index', e.nativeEvent.layout)}>
          <Icon
            as={tabs[0].icon}
            size={22}
            className={activeTab === 'index' ? 'text-primary' : 'text-muted'}
          />
        </TouchableOpacity>

        {/* Tab: Transactions */}
        <TouchableOpacity
          className="items-center justify-center h-12 w-12 rounded-full z-10"
          onPress={() => handleTabPress('transactions')}
          activeOpacity={0.7}
          onLayout={(e) => handleLayout('transactions', e.nativeEvent.layout)}>
          <Icon
            as={tabs[1].icon}
            size={22}
            className={activeTab === 'transactions' ? 'text-primary' : 'text-muted'}
          />
        </TouchableOpacity>

        {/* Add Button */}
        <TouchableOpacity
          className="h-12 w-12 mx-1 items-center justify-center rounded-full bg-primary shadow-md active:scale-95 z-10"
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.8}>
          <Icon as={Plus} className="text-[--primary-foreground]" size={24} />
        </TouchableOpacity>

        {/* Tab: Wallets */}
        <TouchableOpacity
          className="items-center justify-center h-12 w-12 rounded-full z-10"
          onPress={() => handleTabPress('wallets')}
          activeOpacity={0.7}
          onLayout={(e) => handleLayout('wallets', e.nativeEvent.layout)}>
          <Icon
            as={tabs[2].icon}
            size={22}
            className={activeTab === 'wallets' ? 'text-primary' : 'text-muted'}
          />
        </TouchableOpacity>

        {/* Tab: Profile */}
        <TouchableOpacity
          className="items-center justify-center h-12 w-12 rounded-full z-10"
          onPress={() => handleTabPress('profile')}
          activeOpacity={0.7}
          onLayout={(e) => handleLayout('profile', e.nativeEvent.layout)}>
          <Icon
            as={tabs[3].icon}
            size={22}
            className={activeTab === 'profile' ? 'text-primary' : 'text-muted'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
