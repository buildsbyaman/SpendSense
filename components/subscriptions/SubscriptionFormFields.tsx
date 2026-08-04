import { View, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { type SubscriptionCycle } from '@/utils/subscription';
import { sanitizeAmountInput } from '@/utils/transaction';
import { CycleSelector } from '@/components/subscriptions/CycleSelector';
import { EndDateSelector } from '@/components/subscriptions/EndDateSelector';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import { CategorySelector } from '@/components/categories/CategorySelector';
import { QuickDatePicker } from '@/components/transactions/QuickDatePicker';
import AnimatedSegment from '@/components/ui/animated-segment';
import type { Account } from '@/utils/wallet';
import { router } from 'expo-router';

interface Props {
  name: string;
  setName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  cycle: SubscriptionCycle;
  setCycle: (v: SubscriptionCycle) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  selectedWalletId: string;
  setSelectedWalletId: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  nextDate: Date;
  setNextDate: (v: Date) => void;
  hasEndDate: boolean;
  endDate: Date;
  onChangeHasEndDate: (v: boolean) => void;
  onChangeEndDate: (v: Date) => void;
  onOpenEndDatePicker: () => void;
  onOpenDatePicker: () => void;
  accounts: Account[];
  sortedAccounts: Account[];
  categoriesList: Array<{ name: string; icon?: string; color?: string }>;
  placeholderColor: string;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
  userProfile: { currencySymbol: string };
}

export function SubscriptionFormFields({
  name,
  setName,
  amount,
  setAmount,
  cycle,
  setCycle,
  isActive,
  setIsActive,
  selectedWalletId,
  setSelectedWalletId,
  category,
  setCategory,
  nextDate,
  setNextDate,
  hasEndDate,
  endDate,
  onChangeHasEndDate,
  onChangeEndDate,
  onOpenEndDatePicker,
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
      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Subscription Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${focusedInput === 'name' ? 'border-primary' : 'border-border'}`}
          placeholder="Netflix, Spotify, Gym, etc."
          placeholderTextColor={placeholderColor}
          onFocus={() => setFocusedInput('name')}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

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
        <Text className="mb-2 ml-1 text-sm text-muted">Billing Cycle</Text>
        <CycleSelector value={cycle} onChange={setCycle} />
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Status</Text>
        <AnimatedSegment<'active' | 'paused'>
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' },
          ]}
          selectedValue={isActive ? 'active' : 'paused'}
          onChange={(val) => setIsActive(val === 'active')}
        />
        <Text className="mt-2 text-center text-xs text-muted">
          {isActive ? 'Auto-billing is enabled.' : 'Auto-billing is paused.'}
        </Text>
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Select Wallet for Auto-Pay</Text>
        <WalletSelector
          accounts={accounts}
          sortedAccounts={sortedAccounts}
          selectedWalletId={selectedWalletId}
          onSelect={setSelectedWalletId}
          emptyMessage="Create a wallet first"
          onEmptyAction={() => {
            router.push('/(tabs)/wallets');
          }}
        />
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Category</Text>
        <CategorySelector
          categories={categoriesList as Array<{ name: string; icon?: string; color?: string }>}
          selected={category}
          onSelect={setCategory}
        />
      </View>

      <View>
        <Text className="mb-2 ml-1 text-sm text-muted">Next Billing Date</Text>
        <QuickDatePicker
          date={nextDate}
          onSelectToday={() => setNextDate(new Date())}
          onOpenCalendar={onOpenDatePicker}
        />
      </View>

      <EndDateSelector
        hasEndDate={hasEndDate}
        endDate={endDate}
        nextDate={nextDate}
        onChangeHasEndDate={onChangeHasEndDate}
        onChangeEndDate={onChangeEndDate}
        onOpenPicker={onOpenEndDatePicker}
      />
    </View>
  );
}
