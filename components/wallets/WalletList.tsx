import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Wallet, Plus } from 'lucide-react-native';
import { WalletItem } from './WalletItem';
import { type Account } from '@/utils/wallet';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

import { EmptyState } from '@/components/ui/EmptyState';

interface WalletListProps {
  accounts: Account[];
  expandedWalletId: string | null;
  onToggleExpand: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onAddFirstWallet: () => void;
  onEditClick: (id: string) => void;
  reorderMode?: boolean;
  onReorderEnd?: (order: Account[]) => void;
  listHeader?: React.ReactElement | null;
  listRef?: React.Ref<any>;
  maxHeight?: number;
}

export function WalletList({
  accounts,
  expandedWalletId,
  onToggleExpand,
  onSetDefault,
  onDeleteClick,
  onAddFirstWallet,
  onEditClick,
  reorderMode = false,
  onReorderEnd,
  listHeader,
  listRef,
  maxHeight,
}: WalletListProps) {

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No Wallets Yet"
        description="Add your first wallet to start tracking your balances and transactions."
        buttonText="Add Your First Wallet"
        onButtonPress={onAddFirstWallet}
      />
    );
  }

  const ItemSeparator = () => <View className="h-[1px] bg-divider" />;

  return (
    <View
      className="overflow-hidden rounded-xl border border-border bg-surface"
      style={{
        marginHorizontal: 20,
        flexShrink: 1,
        ...(maxHeight && maxHeight > 0 ? { maxHeight } : {}),
      }}>
      <DraggableFlatList
        ref={listRef}
        data={accounts}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => onReorderEnd?.(data)}
        renderItem={({ item, drag, isActive }) => {
          return (
            <ScaleDecorator>
              <WalletItem
                account={item}
                isExpanded={!reorderMode && expandedWalletId === item.id}
                onToggleExpand={() => onToggleExpand(item.id)}
                onSetDefault={() => onSetDefault(item.id)}
                onDelete={() => onDeleteClick(item.id)}
                onEditClick={() => onEditClick(item.id)}
                drag={reorderMode ? drag : undefined}
                isDragging={isActive}
                reorderMode={reorderMode}
              />
            </ScaleDecorator>
          );
        }}
        ListHeaderComponent={listHeader}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        style={maxHeight && maxHeight > 0 ? { maxHeight } : undefined}
        containerStyle={{ flexShrink: 1 }}
      />
    </View>
  );
}
