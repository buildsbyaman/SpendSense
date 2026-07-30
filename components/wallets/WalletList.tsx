import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Wallet, Plus } from 'lucide-react-native';
import { WalletItem } from './WalletItem';
import { type Account } from '@/utils/wallet';

interface WalletListProps {
  accounts: Account[];
  expandedWalletId: string | null;
  onToggleExpand: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onAddFirstWallet: () => void;
  onUpdate: (updated: Account) => void;
}

export function WalletList({
  accounts,
  expandedWalletId,
  onToggleExpand,
  onSetDefault,
  onDeleteClick,
  onAddFirstWallet,
  onUpdate
}: WalletListProps) {
  if (accounts.length === 0) {
    return (
      <View className="items-center justify-center mt-20 px-6">
        <View className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-full items-center justify-center mb-6">
          <Icon as={Wallet} size={40} className="text-muted opacity-50" />
        </View>
        <Text variant="h3" className="text-center mb-2">No Wallets Yet</Text>
        <Text className="text-muted text-center mb-8">
          Add your first wallet to start tracking your balances and transactions.
        </Text>
        <TouchableOpacity 
          className="bg-black dark:bg-white px-6 py-3.5 rounded-full flex-row items-center gap-2"
          onPress={onAddFirstWallet}
          activeOpacity={0.7}
        >
          <Icon as={Plus} size={20} className="text-white dark:text-black" />
          <Text className="text-white dark:text-black font-semibold text-base">
            Add Your First Wallet
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mb-6">
      {accounts.map((account, index) => (
        <WalletItem
          key={account.id}
          account={account}
          isExpanded={expandedWalletId === account.id}
          isLast={index === accounts.length - 1}
          onToggleExpand={() => onToggleExpand(account.id)}
          onSetDefault={() => onSetDefault(account.id)}
          onDelete={() => onDeleteClick(account.id)}
          onUpdate={onUpdate}
        />
      ))}
    </View>
  );
}
