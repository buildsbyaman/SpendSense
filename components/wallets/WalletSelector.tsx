import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type Account } from '@/utils/wallet';

interface Props {
  accounts: Account[];
  sortedAccounts: Account[];
  selectedWalletId: string;
  onSelect: (id: string) => void;
  emptyMessage: string;
  onEmptyAction: () => void;
}

export function WalletSelector({
  accounts,
  sortedAccounts,
  selectedWalletId,
  onSelect,
  emptyMessage,
  onEmptyAction,
}: Props) {
  if (accounts.length === 0) {
    return (
      <TouchableOpacity
        onPress={onEmptyAction}
        className="items-center rounded-lg border border-dashed border-border bg-surface p-3">
        <Text className="text-xs font-semibold text-primary">{emptyMessage}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2 py-0.5">
        {sortedAccounts.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          return (
            <TouchableOpacity
              key={wallet.id}
              onPress={() => onSelect(wallet.id)}
              className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
                isSelected
                  ? 'border-primary bg-primary/10 dark:bg-primary/15'
                  : 'border-border bg-surface'
              }`}>
              <Icon
                as={wallet.icon}
                size={14}
                className={isSelected ? 'text-primary' : 'text-foreground'}
              />
              <View>
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}>
                  {wallet.name}
                </Text>
                <Text
                  className={`text-[10px] ${
                    isSelected ? 'text-primary opacity-70' : 'text-muted'
                  }`}>
                  {wallet.balance}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
