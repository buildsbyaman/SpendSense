import { View, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { type TransactionType, sanitizeAmountInput } from '@/utils/transaction';
import TransactionTypeToggle from '@/components/transactions/TransactionTypeToggle';
import { QuickDatePicker } from '@/components/transactions/QuickDatePicker';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { CategorySelector } from '@/components/categories/CategorySelector';
import type { Account } from '@/utils/wallet';
import { router } from 'expo-router';

interface Props {
  type: TransactionType;
  onTypeChange: (t: TransactionType) => void;
  amount: string;
  setAmount: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  selectedWalletId: string;
  setSelectedWalletId: (v: string) => void;
  selectedToWalletId: string;
  setSelectedToWalletId: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  date: Date;
  setDate: (v: Date) => void;
  onOpenDatePicker: () => void;
  accounts: Account[];
  sortedAccounts: Account[];
  categoriesList: Array<{ name: string; icon?: string; color?: string }>;
  placeholderColor: string;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
  userProfile: { currencySymbol: string };
}

export function TransactionFormFields({
  type,
  onTypeChange,
  amount,
  setAmount,
  title,
  setTitle,
  selectedWalletId,
  setSelectedWalletId,
  selectedToWalletId,
  setSelectedToWalletId,
  category,
  setCategory,
  date,
  setDate,
  onOpenDatePicker,
  accounts,
  sortedAccounts,
  categoriesList,
  placeholderColor,
  focusedInput,
  setFocusedInput,
  userProfile,
}: Props) {
  const isTransfer = type === 'transfer';
  const toAccounts = isTransfer
    ? sortedAccounts.filter((a) => a.id !== selectedWalletId)
    : sortedAccounts;

  return (
    <View className="gap-3">
      <TransactionTypeToggle type={type} onChange={onTypeChange} />

      <View className="flex-row gap-2.5">
        <View className="w-[42%]">
          <Text className="mb-1 ml-0.5 text-xs font-medium text-muted">Amount</Text>
          <View className="relative justify-center">
            <Text className="absolute left-3 z-10 text-sm font-semibold text-foreground">
              {userProfile.currencySymbol}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
              className={`h-11 rounded-lg border bg-surface pl-7 pr-2.5 text-sm font-semibold text-foreground ${
                focusedInput === 'amount' ? 'border-primary' : 'border-border'
              }`}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={placeholderColor}
              onFocus={() => setFocusedInput('amount')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

        <View className="flex-1">
          <Text className="mb-1 ml-0.5 text-xs font-medium text-muted" numberOfLines={1}>
            {isTransfer
              ? 'Note (Optional)'
              : type === 'expense'
                ? 'Description (Optional)'
                : 'Source (Optional)'}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            className={`h-11 rounded-lg border bg-surface px-3 text-sm text-foreground ${
              focusedInput === 'title' ? 'border-primary' : 'border-border'
            }`}
            placeholder={
              isTransfer
                ? 'e.g. Top up UPI'
                : type === 'expense'
                  ? 'e.g. Starbucks'
                  : 'e.g. Bonus, Salary'
            }
            placeholderTextColor={placeholderColor}
            onFocus={() => setFocusedInput('title')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      {isTransfer ? (
        <>
          <View>
            <Text className="mb-1 ml-0.5 text-xs font-medium text-muted">From Wallet</Text>
            <WalletSelector
              accounts={accounts}
              sortedAccounts={sortedAccounts}
              selectedWalletId={selectedWalletId}
              onSelect={setSelectedWalletId}
              emptyMessage="Create a wallet first"
              onEmptyAction={() => router.push('/add-wallet')}
            />
          </View>

          <View>
            <Text className="mb-1 ml-0.5 text-xs font-medium text-muted">To Wallet</Text>
            <WalletSelector
              accounts={accounts}
              sortedAccounts={toAccounts}
              selectedWalletId={selectedToWalletId}
              onSelect={setSelectedToWalletId}
              emptyMessage="Create a wallet first"
              onEmptyAction={() => router.push('/add-wallet')}
            />
          </View>
        </>
      ) : (
        <>
          <View>
            <Text className="mb-1 ml-0.5 text-xs font-medium text-muted">Select Wallet</Text>
            <WalletSelector
              accounts={accounts}
              sortedAccounts={sortedAccounts}
              selectedWalletId={selectedWalletId}
              onSelect={setSelectedWalletId}
              emptyMessage="Create a wallet first"
              onEmptyAction={() => router.push('/add-wallet')}
            />
          </View>

          <View>
            <Text className="mb-1 ml-0.5 text-xs font-medium text-muted">Category</Text>
            <CategorySelector
              categories={categoriesList as Array<{ name: string; icon?: string; color?: string }>}
              selected={category}
              onSelect={setCategory}
              withMeta
            />
          </View>
        </>
      )}

      <View>
        <Text className="mb-1 ml-0.5 text-xs font-medium text-muted">Date</Text>
        <QuickDatePicker
          date={date}
          onSelectToday={() => setDate(new Date())}
          onSelectYesterday={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            setDate(yesterday);
          }}
          onOpenCalendar={onOpenDatePicker}
        />
      </View>
    </View>
  );
}
