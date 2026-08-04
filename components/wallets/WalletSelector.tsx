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
        className="items-center rounded-xl border border-dashed border-border bg-surface p-4">
        <Text className="text-sm font-semibold text-primary">{emptyMessage}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-3 py-1">
        {sortedAccounts.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          return (
            <TouchableOpacity
              key={wallet.id}
              onPress={() => onSelect(wallet.id)}
              className={`flex-row items-center gap-2.5 rounded-xl border px-4 py-3 ${
                isSelected
                  ? 'bg-primary/10 dark:bg-primary/15 border-primary'
                  : 'border-border bg-surface'
              }`}>
              <Icon
                as={wallet.icon}
                size={16}
                className={isSelected ? 'text-primary' : 'text-foreground'}
              />
              <View>
                <Text
                  className={`text-sm font-semibold ${
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
