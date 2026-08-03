import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Star, ChevronDown } from 'lucide-react-native';
import { type Account, parseBalance, formatWalletDisplay } from '@/utils/wallet';
import { useApp } from '@/context/AppContext';
import { useExpandAnimation } from '@/hooks/useExpandAnimation';
import Animated from 'react-native-reanimated';

interface WalletItemProps {
  account: Account;
  isExpanded: boolean;
  isLast: boolean;
  onToggleExpand: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onEditClick: () => void;
}

export function WalletItem({
  account,
  isExpanded,
  isLast,
  onToggleExpand,
  onSetDefault,
  onDelete,
  onEditClick,
}: WalletItemProps) {
  const { userProfile } = useApp();
  const numericBalance = parseBalance(account.balance);
  const displayBalance = formatWalletDisplay(numericBalance, userProfile.currencySymbol);
  const balanceColorClass = numericBalance >= 0 ? 'text-income' : 'text-expense';

  const { actionsStyle, chevronStyle } = useExpandAnimation(isExpanded);

  return (
    <View className="mb-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
      {/* Main row */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onToggleExpand}
        className="flex-row items-center justify-between px-5 py-5">
        <View className="mr-2 flex-1 flex-row items-center gap-4">
          <View className="relative h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900">
            <Icon as={account.icon} size={22} className="text-foreground" />
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
          <Animated.View style={chevronStyle} className="shrink-0">
            <Icon as={ChevronDown} size={20} className="text-muted" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Actions — always mounted, animated in/out via maxHeight + opacity */}
      <Animated.View style={actionsStyle}>
        <View className="flex-row gap-2.5 px-4 pb-4">
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-full py-3 ${
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
            className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
            onPress={onEditClick}>
            <Text className="text-xs font-bold text-foreground">Edit</Text>
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
