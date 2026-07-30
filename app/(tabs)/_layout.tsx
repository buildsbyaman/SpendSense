import { View } from 'react-native';
import { TabSlot, useTabsWithTriggers } from 'expo-router/ui';
import { TabBar } from '@/components/layout/tab-bar';

export default function TabLayout() {
  const { NavigationContent } = useTabsWithTriggers({
    triggers: [
      { name: 'index', href: '/' as const, type: 'internal' },
      { name: 'transactions', href: '/transactions' as const, type: 'internal' },
      { name: 'wallets', href: '/wallets' as const, type: 'internal' },

      { name: 'profile', href: '/profile' as const, type: 'internal' },
    ],
  });

  return (
    <NavigationContent>
      <View className="flex-1">
        <TabSlot style={{ flex: 1 }} />
        <TabBar />
      </View>
    </NavigationContent>
  );
}
