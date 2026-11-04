import {
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  X,
  Trash2,
  Check,
  Delete,
  Landmark,
  CreditCard,
  Smartphone,
  Wallet,
  Star,
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { formatWalletBalance, validateWallet } from '@/utils/wallet';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayOfMonthPicker } from '@/components/wallets/DayOfMonthPicker';
import AnimatedSegment from '@/components/ui/animated-segment';
import { ScreenTransition } from '@/components/ui/ScreenTransition';
import { triggerKeypadHaptic, triggerSuccessHaptic } from '@/utils/haptics';

const ACCOUNT_TYPES = ['Card', 'Bank', 'Digital', 'Cash'] as const;

export default function AddWalletScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { accounts, addWallet, updateWallet, deleteWallet, setDefaultWallet, userProfile } =
    useApp();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [accountType, setAccountType] = useState<'Card' | 'Bank' | 'Digital' | 'Cash'>('Bank');
  const [dueEnabled, setDueEnabled] = useState(false);
  const [dueDay, setDueDay] = useState(1);
  const [billEnabled, setBillEnabled] = useState(false);
  const [billDay, setBillDay] = useState(1);

  // Modals
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [numberInput, setNumberInput] = useState('');

  useEffect(() => {
    if (editId) {
      const wallet = accounts.find((a) => a.id === editId);
      if (wallet) {
        setNewName(wallet.name);
        setNewNumber(wallet.number || '');
        setNewBalance(wallet.balance.replace(/[^0-9.-]/g, ''));
        setAccountType((wallet.type as any) || 'Card');
        setDueEnabled(wallet.dueDay != null);
        setDueDay(wallet.dueDay ?? 1);
        setBillEnabled(wallet.billDay != null);
        setBillDay(wallet.billDay ?? 1);
      }
    }
  }, [editId, accounts]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/wallets');
    }
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, []);

  // Keypad logic
  const handleToggleNegative = () => {
    triggerKeypadHaptic();
    if (newBalance.startsWith('-')) {
      setNewBalance(newBalance.slice(1));
    } else {
      setNewBalance('-' + newBalance);
    }
  };

  const handleKeyPress = (key: string) => {
    triggerKeypadHaptic();
    if (key === '.') {
      if (newBalance.includes('.')) return;
      if (!newBalance || newBalance === '-') {
        setNewBalance(newBalance ? '-0.' : '0.');
      } else {
        setNewBalance(newBalance + '.');
      }
      return;
    }

    if (newBalance === '0') {
      if (key === '0') return;
      setNewBalance(key);
      return;
    }

    if (newBalance === '-0' || newBalance === '-') {
      if (key === '0') {
        setNewBalance('-0');
        return;
      }
      setNewBalance('-' + key);
      return;
    }

    // Limit to 2 decimal places
    if (newBalance.includes('.')) {
      const parts = newBalance.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    // Limit max digits
    if (newBalance.replace(/[^0-9]/g, '').length >= 9) return;

    setNewBalance((prev) => prev + key);
  };

  const handleBackspace = () => {
    triggerKeypadHaptic();
    if (!newBalance || newBalance.length <= 1 || newBalance === '-') {
      setNewBalance('');
    } else {
      const next = newBalance.slice(0, -1);
      if (next === '-') {
        setNewBalance('');
      } else {
        setNewBalance(next);
      }
    }
  };

  const handleClear = () => {
    triggerKeypadHaptic();
    setNewBalance('');
  };

  const savingRef = useRef(false);

  const handleSave = () => {
    triggerSuccessHaptic();
    if (savingRef.current) return;

    const newErrors = validateWallet(newName, newBalance);
    if (Object.keys(newErrors).length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: newErrors.name || newErrors.balance || 'Please enter wallet name and initial balance',
      });
      if (newErrors.name) {
        setNameInput(newName);
        setNumberInput(newNumber);
        setIsNameModalOpen(true);
      }
      return;
    }

    savingRef.current = true;
    try {
      const formattedName = newName.trim();
      const formattedBalance = formatWalletBalance(newBalance, userProfile.currencySymbol);

      let icon = Wallet;
      if (accountType === 'Bank') icon = Landmark;
      if (accountType === 'Card') icon = CreditCard;
      if (accountType === 'Digital') icon = Smartphone;

      if (editId) {
        updateWallet({
          id: editId,
          name: formattedName,
          number: newNumber.trim(),
          balance: formattedBalance,
          icon,
          type: accountType,
          isDefault: accounts.find((a) => a.id === editId)?.isDefault || false,
          dueDay: dueEnabled ? dueDay : null,
          billDay: billEnabled ? billDay : null,
        });
        Toast.show({
          type: 'success',
          text1: 'Wallet Updated',
          text2: 'Your wallet has been updated successfully',
        });
      } else {
        addWallet({
          name: formattedName,
          number: newNumber.trim(),
          balance: formattedBalance,
          icon,
          type: accountType,
          dueDay: dueEnabled ? dueDay : null,
          billDay: billEnabled ? billDay : null,
        });
        Toast.show({
          type: 'success',
          text1: 'Wallet Added',
          text2: 'Your new wallet has been successfully added',
        });
      }

      handleClose();
    } finally {
      savingRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (editId) {
      try {
        const result = await deleteWallet(editId);
        if (!result.blocked) {
          if (result.newDefaultName) {
            Toast.show({
              type: 'success',
              text1: 'Wallet Deleted',
              text2: `"${result.newDefaultName}" is now your default wallet.`,
            });
          } else {
            Toast.show({
              type: 'success',
              text1: 'Wallet Deleted',
              text2: 'Transactions have been moved to your default wallet.',
            });
          }
          handleClose();
        }
      } catch {
        Toast.show({
          type: 'error',
          text1: 'Delete Failed',
          text2: 'Could not delete the wallet.',
        });
      }
    }
  };

  const handleSetDefault = () => {
    if (editId) {
      setDefaultWallet(editId);
      Toast.show({
        type: 'success',
        text1: 'Default Set',
        text2: 'Wallet has been set as your default.',
      });
      handleClose();
    }
  };

  const isCurrentDefault = accounts.find((a) => a.id === editId)?.isDefault || false;

  return (
    <ScreenTransition
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}>
      {/* ── Top Bar: Close (Left), Heading (Center), Delete / Spacer (Right) ── */}
      <View className="flex-row items-center justify-between px-5 pt-1 pb-1">
        <TouchableOpacity
          onPress={handleClose}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-surface shadow-xs active:scale-95"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon as={X} size={18} className="text-foreground" />
        </TouchableOpacity>

        <Text className="text-xl font-semibold text-foreground">
          {editId ? 'Edit Wallet' : 'New Wallet'}
        </Text>

        {editId ? (
          <TouchableOpacity
            onPress={handleDelete}
            className="h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-red-50 shadow-xs active:scale-95 dark:border-red-900/40 dark:bg-red-950/20"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon as={Trash2} size={18} className="text-red-500" />
          </TouchableOpacity>
        ) : (
          <View className="h-11 w-11" />
        )}
      </View>

      {/* ── Account Type Segmented Capsule ── */}
      <View className="items-center justify-center px-5 pt-0.5 pb-1.5">
        <View className="w-full max-w-[320px]">
          <AnimatedSegment<'Card' | 'Bank' | 'Digital' | 'Cash'>
            options={ACCOUNT_TYPES.map((t) => ({ label: t.toLowerCase(), value: t }))}
            selectedValue={accountType}
            onChange={setAccountType}
            paddingVertical={6}
            fontSize={12}
          />
        </View>
      </View>

      {/* ── Subtitle / Info ── */}
      <View className="items-center justify-center px-5 pt-1 pb-1">
        <Text className="text-[11px] font-medium text-muted">
          Initial / Current Balance
        </Text>
      </View>

      {/* ── Center Hero Balance Display (Zero Overlap, Mathematically Centered) ── */}
      <View className="flex-1 items-center justify-center px-4">
        <View className="w-full flex-row items-center justify-center">
          {/* Symmetrical Left Container with ± (Negative Toggle) Button */}
          <View className="h-11 w-11 items-center justify-center">
            <TouchableOpacity
              onPress={handleToggleNegative}
              activeOpacity={0.7}
              className={`h-10 w-10 items-center justify-center rounded-full border active:scale-90 ${
                newBalance.startsWith('-')
                  ? 'border-black bg-surface dark:border-white'
                  : 'border-border bg-surface/60'
              }`}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text
                className={`text-base font-semibold ${
                  newBalance.startsWith('-') ? 'font-bold text-foreground' : 'text-muted'
                }`}>
                ±
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance Text */}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            className={`flex-1 text-center font-bold tracking-tight ${
              newBalance.replace('-', '') || newBalance.startsWith('-') ? 'text-foreground' : 'text-muted/60'
            }`}
            style={{
              fontSize: newBalance.replace('-', '').length > 6 ? 40 : newBalance.replace('-', '').length > 4 ? 48 : 56,
              lineHeight: newBalance.replace('-', '').length > 6 ? 48 : newBalance.replace('-', '').length > 4 ? 56 : 64,
            }}>
            {newBalance.startsWith('-') ? '-' : ''}{userProfile.currencySymbol}{newBalance.replace('-', '') || '0'}
          </Text>

          {/* Right Backspace Container */}
          <View className="h-11 w-11 items-center justify-center">
            {newBalance.length > 0 && (
              <TouchableOpacity
                onPress={handleBackspace}
                onLongPress={handleClear}
                className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface active:scale-90"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon as={Delete} size={18} className="text-foreground" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Scrollable Interactive Details Section ── */}
      <View className="gap-4 pb-3 pt-2">
        {/* Row 1: Wallet Name & Card / Account Number (Squarish rounded-xl) */}
        <View className="flex-row items-center justify-center gap-2.5 px-5">
          <TouchableOpacity
            onPress={() => {
              setNameInput(newName);
              setNumberInput(newNumber);
              setIsNameModalOpen(true);
            }}
            activeOpacity={0.7}
            className={`h-10 flex-row items-center gap-2 rounded-xl border px-4 ${
              newName.trim()
                ? 'border-black bg-surface dark:border-white'
                : 'border-border bg-surface/60'
            }`}>
            <Icon as={Wallet} size={14} className="text-muted" />
            <Text
              className={`text-xs ${
                newName.trim() ? 'font-bold text-foreground' : 'font-medium text-muted'
              }`}
              numberOfLines={1}>
              {newName.trim() ? newName : 'wallet name'}
            </Text>
          </TouchableOpacity>

          {newNumber.trim() ? (
            <TouchableOpacity
              onPress={() => {
                setNameInput(newName);
                setNumberInput(newNumber);
                setIsNameModalOpen(true);
              }}
              activeOpacity={0.7}
              className="h-10 flex-row items-center gap-1.5 rounded-xl border border-border bg-surface/60 px-3.5">
              <Icon as={CreditCard} size={13} className="text-muted" />
              <Text className="text-xs font-medium text-muted">
                •••• {newNumber.slice(-4)}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setNameInput(newName);
                setNumberInput(newNumber);
                setIsNameModalOpen(true);
              }}
              activeOpacity={0.7}
              className="h-10 flex-row items-center gap-1 rounded-xl border border-border bg-surface/60 px-3.5">
              <Text className="text-xs text-muted">+ number</Text>
            </TouchableOpacity>
          )}

          {editId && !isCurrentDefault && (
            <TouchableOpacity
              onPress={handleSetDefault}
              activeOpacity={0.7}
              className="h-10 flex-row items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5">
              <Icon as={Star} size={13} className="text-foreground" />
              <Text className="text-xs font-semibold text-foreground">Set Default</Text>
            </TouchableOpacity>
          )}

          {editId && isCurrentDefault && (
            <View className="h-10 flex-row items-center gap-1.5 rounded-xl border border-black bg-surface px-3.5 dark:border-white">
              <Icon as={Star} size={13} className="text-foreground" />
              <Text className="text-xs font-bold text-foreground">Default</Text>
            </View>
          )}
        </View>

        {/* Card Billing/Due Dates: Inline Scrollable Lists with Proper Spacing */}
        {accountType === 'Card' && (
          <View className="gap-4 pt-1">
            <DayOfMonthPicker
              label="Statement / Bill Day"
              value={billDay}
              enabled={billEnabled}
              onChange={setBillDay}
              onToggleEnabled={setBillEnabled}
            />
            <DayOfMonthPicker
              label="Payment Due Date"
              value={dueDay}
              enabled={dueEnabled}
              onChange={setDueDay}
              onToggleEnabled={setDueEnabled}
            />
          </View>
        )}
      </View>

      {/* ── Keypad Section: 3x4 Grid of Circular Buttons ── */}
      <View className="px-7 pb-2">
        <View className="gap-3">
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['.', '0', 'confirm'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row items-center justify-around">
              {row.map((item) => {
                if (item === 'confirm') {
                  return (
                    <View
                      key="confirm"
                      className="h-[68px] w-[68px] items-center justify-center">
                      <TouchableOpacity
                        onPress={handleSave}
                        activeOpacity={0.7}
                        className="h-[56px] w-[56px] items-center justify-center rounded-full bg-black active:scale-95 active:opacity-80 dark:bg-white"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon
                          as={Check}
                          size={22}
                          strokeWidth={2.4}
                          color={colorScheme === 'dark' ? '#000000' : '#FFFFFF'}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleKeyPress(item)}
                    activeOpacity={0.7}
                    className="h-[68px] w-[68px] items-center justify-center rounded-full bg-[#F3F3F4] dark:bg-[#1E1E1E] active:scale-95 active:bg-[#E5E5EA] dark:active:bg-[#2C2C2E]">
                    <Text
                      className={`${item === '.' ? 'text-3xl font-bold -mt-2' : 'text-2xl font-normal'} text-foreground`}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* ── Name & Account Number Input Modal ── */}
      <Modal
        visible={isNameModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsNameModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center bg-black/60 px-6">
          <View className="rounded-2xl border border-border bg-background p-5">
            <Text className="mb-2 text-base font-bold text-foreground">
              Wallet Details
            </Text>
            <View className="gap-3">
              <View>
                <Text className="mb-1 text-xs text-muted">Wallet Name *</Text>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  placeholder="e.g. Chase Sapphire, Cash, Apple Pay"
                  placeholderTextColor={placeholderColor}
                  className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
                />
              </View>
              <View>
                <Text className="mb-1 text-xs text-muted">Account / Card Number (Optional)</Text>
                <TextInput
                  value={numberInput}
                  onChangeText={setNumberInput}
                  placeholder="e.g. 1234"
                  keyboardType="number-pad"
                  placeholderTextColor={placeholderColor}
                  className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground"
                />
              </View>
            </View>
            <View className="mt-4 flex-row justify-end gap-2.5">
              <TouchableOpacity
                onPress={() => setIsNameModalOpen(false)}
                className="rounded-lg px-3.5 py-2">
                <Text className="text-xs font-medium text-muted">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setNewName(nameInput.trim());
                  setNewNumber(numberInput.trim());
                  setIsNameModalOpen(false);
                }}
                className="rounded-lg border border-black bg-surface px-4 py-2 dark:border-white">
                <Text className="text-xs font-semibold text-foreground">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenTransition>
  );
}