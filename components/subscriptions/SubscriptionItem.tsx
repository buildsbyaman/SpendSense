import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown } from 'lucide-react-native';
import { getCategoryIcon, getCategoryColor } from '@/utils/transaction';
import { type Subscription } from '@/utils/subscription';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';

const DURATION = 280;
const EASING = Easing.out(Easing.cubic);

interface SubscriptionItemProps {
  subscription: Subscription;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
}

export function SubscriptionItem({
  subscription,
  isExpanded,
  onToggleExpand,
  onDelete,
}: SubscriptionItemProps) {
  const { accounts, userProfile } = useApp();
  const wallet = accounts.find((a) => a.id === subscription.wallet_id);

  const progress = useSharedValue(isExpanded ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(isExpanded ? 1 : 0, { duration: DURATION, easing: EASING });
  }, [isExpanded]);

  const actionsStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(progress.value, [0, 1], [0, 70]),
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0, 1]),
    overflow: 'hidden',
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
  }));

  const icon = getCategoryIcon(subscription.category, subscription.name);
  const color = getCategoryColor(subscription.category);

  const nextDateStr = new Date(subscription.next_billing_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const rowView = (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggleExpand}
      className={`flex-row items-center justify-between px-5 py-5 ${subscription.is_active === 0 ? 'opacity-50' : ''}`}>
      <View className="mr-2 flex-1 flex-row items-center gap-4">
        <View
          className="relative h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}15` }}>
          <Icon as={icon} size={22} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
            {subscription.name}
          </Text>
          <Text className="mt-0.5 text-sm text-muted" numberOfLines={1}>
            {wallet?.name || 'Unknown'} • <Text className="capitalize">{subscription.cycle}</Text> • Next: {nextDateStr}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <View className="items-end">
          <Text className="text-expense text-base font-bold">
            {userProfile.currencySymbol}{subscription.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          {subscription.is_active === 0 && (
            <Text className="text-[10px] font-bold text-muted uppercase tracking-wider">Paused</Text>
          )}
        </View>
        <Animated.View style={chevronStyle}>
          <Icon as={ChevronDown} size={20} className="text-muted" />
        </Animated.View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
      {rowView}
      <Animated.View style={actionsStyle}>
        <View className="flex-row gap-2.5 px-4 pb-4">
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
            onPress={() => router.push({ pathname: '/add-subscription', params: { editId: subscription.id } })}>
            <Text className="text-foreground text-xs font-bold">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-red-50 py-3 dark:bg-red-950/20"
            onPress={onDelete}>
            <Text className="text-xs font-bold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
