import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Star, ChevronDown, GripVertical } from 'lucide-react-native';
import { type Account, parseBalance, formatWalletDisplay, getWalletTypeColor } from '@/utils/wallet';
import { useApp } from '@/context/AppContext';
import { useExpandAnimation } from '@/hooks/useExpandAnimation';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface WalletItemProps {
  account: Account;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onEditClick: () => void;
  drag?: () => void;
  isDragging?: boolean;
  reorderMode?: boolean;
}

export function WalletItem({
  account,
  isExpanded,
  onToggleExpand,
  onSetDefault,
  onDelete,
  onEditClick,
  drag,
  isDragging,
  reorderMode = false,
}: WalletItemProps) {
  const { userProfile } = useApp();
  const numericBalance = parseBalance(account.balance);
  const displayBalance = formatWalletDisplay(numericBalance, userProfile.currencySymbol);
  const balanceColorClass = numericBalance >= 0 ? 'text-income' : 'text-expense';
  const typeColor = getWalletTypeColor(account.type);

  // Automatically collapse accordion actions when reorderMode is active
  const { actionsStyle, chevronStyle } = useExpandAnimation(reorderMode ? false : isExpanded);

  const dragStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(reorderMode ? 36 : 0, { duration: 250 }),
      opacity: withTiming(reorderMode ? 1 : 0, { duration: 200 }),
      marginRight: withTiming(reorderMode ? 8 : 0, { duration: 250 }),
    };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(reorderMode ? 0 : 20, { duration: 250 }),
      opacity: withTiming(reorderMode ? 0 : 1, { duration: 200 }),
    };
  });

  return (
    <View>
      {/* Main row */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={reorderMode ? undefined : onToggleExpand}
        onLongPress={drag}
        disabled={isDragging}
        className="flex-row items-center justify-between px-5 py-6"
        style={{ opacity: isDragging ? 0.9 : 1 }}>
        
        {/* Grip handle wrapper */}
        <Animated.View style={[dragStyle, { overflow: 'hidden', justifyContent: 'center' }]}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPressIn={drag}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <Icon as={GripVertical} size={16} className="text-muted" />
          </TouchableOpacity>
        </Animated.View>

        <View className="mr-2 flex-1 flex-row items-center gap-3">
          <View
            className="relative h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${typeColor}20` }}>
            <Icon as={account.icon} size={18} color={typeColor} />
            {account.isDefault && (
              <View className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary dark:border-gray-900">
                <Icon as={Star} size={10} className="text-white dark:text-black" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {account.name}
            </Text>
            {!!account.number && (
              <Text className="mt-0.5 text-sm text-muted">{account.number}</Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className={`text-base font-bold ${balanceColorClass}`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{displayBalance}</Text>
          
          {/* Chevron container */}
          <Animated.View style={[rightActionStyle, { overflow: 'hidden' }]}>
            <Animated.View style={chevronStyle} className="shrink-0">
              <Icon as={ChevronDown} size={20} className="text-muted" />
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Actions — always mounted, animated in/out via maxHeight + opacity */}
      <Animated.View style={actionsStyle}>
        <View className="h-[1px] bg-divider" />
        <View className="flex-row gap-2.5 px-4 py-3">
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-[6px] py-3 ${
              account.isDefault ? 'bg-secondary opacity-50' : 'bg-primary'
            }`}
            disabled={account.isDefault}
            onPress={onSetDefault}>
            <Text
              className={`text-xs font-bold ${
                account.isDefault ? 'text-muted' : 'text-white dark:text-black'
              }`}>
              Set Default
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-3"
            onPress={onEditClick}>
            <Text className="text-xs font-bold text-foreground">Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-[6px] bg-red-50 py-3 dark:bg-red-950/20"
            onPress={onDelete}>
            <Text className="text-xs font-bold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
