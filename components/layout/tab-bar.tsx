import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTabTrigger } from 'expo-router/ui';
import { Icon } from '@/components/ui/icon';
import { LayoutDashboard, ArrowUpDown, Plus, ChartPie, Cog, Wallet, type LucideIcon } from 'lucide-react-native';

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

function TabItem({ name, icon }: TabDef) {
  const { triggerProps } = useTabTrigger({ name });

  return (
    <TouchableOpacity
      className={`items-center justify-center h-12 w-12 rounded-full ${triggerProps.isFocused ? 'bg-primary/15 dark:bg-primary/20' : 'bg-transparent'}`}
      onPress={triggerProps.onPress ?? undefined}
      onLongPress={triggerProps.onLongPress ?? undefined}
      activeOpacity={0.7}
    >
      <Icon
        as={icon}
        size={22}
        className={triggerProps.isFocused ? 'text-primary' : 'text-muted'}
      />
    </TouchableOpacity>
  );
}

export function TabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 w-full" 
      style={{ paddingBottom: Math.max(insets.bottom, 24) }} 
      pointerEvents="box-none"
    >
      {/* Main Tab Bar */}
      <View className="mx-4 bg-surface rounded-full shadow-md flex-row items-center justify-between px-2 py-2 border border-black/5 dark:border-white/5">
        <TabItem {...tabs[0]} />
        <TabItem {...tabs[1]} />
        
        {/* Integrated Action Button */}
        <TouchableOpacity
          className="h-12 w-12 mx-1 items-center justify-center rounded-full bg-black dark:bg-white shadow-md active:scale-95"
          onPress={() => router.push('/add-transaction')}
          activeOpacity={0.8}
        >
          <Icon as={Plus} className="text-white dark:text-black" size={24} />
        </TouchableOpacity>

        <TabItem {...tabs[2]} />
        <TabItem {...tabs[3]} />
      </View>
    </View>
  );
}
