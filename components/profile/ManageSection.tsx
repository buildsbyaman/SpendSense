import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  ChevronRight,
  Repeat,
  Tags,
  PiggyBank,
  DollarSign,
  Download,
  FileUp,
  Cloud,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTabNavigation } from '@/context/TabNavigationContext';

interface ManageRow {
  label: string;
  icon: any;
  route:
    | '/subscriptions'
    | '/categories'
    | '/budgets'
    | '/currency'
    | '/export'
    | '/import'
    | '/backup';
  isTab?: boolean;
}

const rows: ManageRow[] = [
  { label: 'Subscriptions', icon: Repeat, route: '/subscriptions', isTab: true },
  { label: 'Categories', icon: Tags, route: '/categories', isTab: true },
  { label: 'Budgets', icon: PiggyBank, route: '/budgets', isTab: true },
  { label: 'Currency Settings', icon: DollarSign, route: '/currency', isTab: true },
  { label: 'Import', icon: FileUp, route: '/import', isTab: true },
  { label: 'Export', icon: Download, route: '/export', isTab: true },
  { label: 'Backup', icon: Cloud, route: '/backup' },
];

export function ManageSection() {
  const { navigate: navigateTab } = useTabNavigation();
  return (
    <View className="mt-6 rounded-xl border border-border bg-surface pt-5 pb-1.5 shadow-xs">
      <Text className="mb-4 px-6 text-sm font-medium text-muted">Manage</Text>
      {rows.map((row, idx) => {
        const isLast = idx === rows.length - 1;
        return (
          <View key={row.route}>
            <TouchableOpacity
              onPress={() => {
                if (row.isTab) {
                  navigateTab(row.route.replace('/', ''));
                } else {
                  router.push(row.route);
                }
              }}
              activeOpacity={0.7}
              className="flex-row items-center gap-3.5 px-6 py-3.5">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Icon as={row.icon} size={18} className="text-foreground" />
              </View>
              <Text className="flex-1 text-base font-medium text-foreground">{row.label}</Text>
              <Icon as={ChevronRight} size={16} className="text-muted" />
            </TouchableOpacity>
            {!isLast && <View className="h-[1px] bg-divider" />}
          </View>
        );
      })}
    </View>
  );
}
