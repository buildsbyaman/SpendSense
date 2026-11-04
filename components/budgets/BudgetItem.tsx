import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import { formatNumber } from '@/utils/wallet';
import { useExpandAnimation } from '@/hooks/useExpandAnimation';
import Animated from 'react-native-reanimated';
import type { Budget } from '@/lib/db/budget';

export type BudgetProgressItem = Budget & {
  spent: number;
  percentage: number;
};

interface BudgetItemProps {
  item: BudgetProgressItem;
  icon: LucideIcon;
  color: string;
  currencySymbol: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function formatBudgetPeriod(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return 'Ongoing (∞)';
  const fmt = (d: string) => {
    const parts = d.split('-');
    if (parts.length === 3) {
      const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (startDate && !endDate) {
    return `From ${fmt(startDate)} • Ongoing (∞)`;
  }
  if (startDate && endDate) {
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }
  if (!startDate && endDate) {
    return `Until ${fmt(endDate)}`;
  }
  return 'Ongoing (∞)';
}

export function BudgetItem({
  item,
  icon,
  color,
  currencySymbol,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: BudgetItemProps) {
  // Expanded height: divider (1px) + period & progress bar & stats (~75px) + action buttons (~55px)
  const { actionsStyle, chevronStyle } = useExpandAnimation(isExpanded, false, 160);

  const isOverBudget = item.spent > item.amount;
  const spentPercent = item.amount > 0 ? Math.round((item.spent / item.amount) * 100) : 0;
  const remaining = Math.max(item.amount - item.spent, 0);
  const overAmount = Math.max(item.spent - item.amount, 0);

  const getSubtitle = () => {
    if (isOverBudget) {
      return `Over budget by ${currencySymbol}${formatNumber(overAmount)}`;
    }
    return `${currencySymbol}${formatNumber(item.spent)} spent`;
  };

  return (
    <View className="mb-3 overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      {/* ── Collapsed Row: Icon, Category Name, Spent Subtitle, Limit, Chevron ── */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleExpand}
        style={{ outline: 'none' } as any}
        className="flex-row items-center justify-between px-5 py-4 focus:outline-none">
        <View className="mr-3 flex-1 flex-row items-center gap-3.5">
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${color}18` }}>
            <Icon as={icon} size={18} color={color} />
          </View>

          <View className="flex-1 justify-center">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {item.category}
            </Text>
            <Text
              className={`mt-0.5 text-xs ${
                isOverBudget
                  ? 'font-medium text-destructive'
                  : 'text-muted'
              }`}
              numberOfLines={1}>
              {getSubtitle()}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2.5">
          <Text className="text-[15px] font-bold text-foreground">
            {currencySymbol}
            {formatNumber(item.amount, 0)}
          </Text>

          <Animated.View style={chevronStyle} className="shrink-0">
            <Icon as={ChevronDown} size={16} className="text-muted" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* ── Expanded Section: Period, Progress Bar, Details, & Actions ── */}
      <Animated.View style={actionsStyle}>
        <View className="h-[1px] bg-divider" />

        {/* Progress Bar & Detailed Stats */}
        <View className="px-5 pt-3.5 pb-2">
          {/* Period Details */}
          <View className="mb-2.5 flex-row items-center justify-between">
            <Text className="text-[11px] font-medium text-muted">Period</Text>
            <Text className="text-[11px] font-medium text-foreground">
              {formatBudgetPeriod(item.start_date, item.end_date)}
            </Text>
          </View>

          <View className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <View
              className={`h-full rounded-full ${
                isOverBudget ? 'bg-destructive' : 'bg-foreground'
              }`}
              style={{ width: `${Math.min(item.percentage, 100)}%` }}
            />
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-muted">
              {spentPercent}% spent
            </Text>
            <Text
              className={`text-xs font-medium ${
                isOverBudget ? 'text-destructive font-semibold' : 'text-muted'
              }`}>
              {isOverBudget
                ? `Exceeded by ${currencySymbol}${formatNumber(overAmount)}`
                : `${currencySymbol}${formatNumber(remaining)} remaining`}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Edit and Delete */}
        <View className="flex-row gap-2.5 px-5 pt-1.5 pb-3.5">
          <TouchableOpacity
            activeOpacity={0.7}
            style={{ outline: 'none' } as any}
            className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-2.5 focus:outline-none"
            onPress={onEdit}>
            <Text className="text-xs font-bold text-foreground">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={{ outline: 'none' } as any}
            className="flex-1 items-center justify-center rounded-[6px] bg-red-50 dark:bg-red-950/20 py-2.5 focus:outline-none"
            onPress={onDelete}>
            <Text className="text-xs font-bold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
