import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronRight, Repeat, CalendarClock, Tags, PiggyBank } from 'lucide-react-native';
import { router } from 'expo-router';

interface ManageRow {
  label: string;
  icon: any;
  route: '/subscriptions' | '/recurring' | '/categories' | '/budgets';
}

const rows: ManageRow[] = [
  { label: 'Subscriptions', icon: Repeat, route: '/subscriptions' },
  { label: 'Recurring Expenses', icon: CalendarClock, route: '/recurring' },
  { label: 'Categories', icon: Tags, route: '/categories' },
  { label: 'Budgets', icon: PiggyBank, route: '/budgets' },
];

export function ManageSection() {
  return (
    <View className="mt-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
      <Text className="mb-4 text-sm font-medium text-muted">Manage</Text>
      {rows.map((row, idx) => {
        const isLast = idx === rows.length - 1;
        return (
          <View key={row.route}>
            <TouchableOpacity
              onPress={() => router.push(row.route)}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                <Icon as={row.icon} size={18} className="text-foreground" />
              </View>
              <Text className="flex-1 text-base font-medium text-foreground">{row.label}</Text>
              <Icon as={ChevronRight} size={16} className="text-muted" />
            </TouchableOpacity>
            {!isLast && <View className="ml-13 h-[1px] bg-divider" />}
          </View>
        );
      })}
    </View>
  );
}
