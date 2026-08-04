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
  return (
    <View className="gap-5">
      <TransactionTypeToggle type={type} onChange={onTypeChange} />

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Amount</Text>
        <View className="relative justify-center">
          <Text className="absolute left-5 z-10 text-base font-semibold text-foreground">
            {userProfile.currencySymbol}
          </Text>
          <TextInput
            value={amount}
            onChangeText={(text) => setAmount(sanitizeAmountInput(text))}
            className={`rounded-xl border bg-surface py-3.5 pl-10 pr-5 text-base font-semibold text-foreground ${focusedInput === 'amount' ? 'border-primary' : 'border-border'}`}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={placeholderColor}
            onFocus={() => setFocusedInput('amount')}
            onBlur={() => setFocusedInput(null)}
          />
        </View>
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">
          {type === 'expense'
            ? 'What was this for? (Optional)'
            : 'Source / Description (Optional)'}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${focusedInput === 'title' ? 'border-primary' : 'border-border'}`}
          placeholder={
            type === 'expense' ? 'e.g. Starbucks Coffee' : 'e.g. Freelance project, Bonus'
          }
          placeholderTextColor={placeholderColor}
          onFocus={() => setFocusedInput('title')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Select Wallet</Text>
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
        <Text className="mb-2 ml-1 text-sm text-muted">Category</Text>
        <CategorySelector
          categories={categoriesList as Array<{ name: string; icon?: string; color?: string }>}
          selected={category}
          onSelect={setCategory}
          withMeta
        />
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Date</Text>
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
