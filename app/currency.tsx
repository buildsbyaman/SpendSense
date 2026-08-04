import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { useApp } from '@/context/AppContext';
import Toast from 'react-native-toast-message';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { CurrencyPresetGrid, CUSTOM_KEY, PRESET_CURRENCIES } from '@/components/currency/CurrencyPresetGrid';
import { CustomCurrencyForm } from '@/components/currency/CustomCurrencyForm';
import { ConversionSection } from '@/components/currency/ConversionSection';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function CurrencySettings() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { userProfile, updateCurrencyAndConvert } = useApp();
  const { navigate: navigateTab } = useTabNavigation();

  const getDefaultSelection = () => {
    return PRESET_CURRENCIES.some((c) => c.code === userProfile.currencyCode)
      ? userProfile.currencyCode
      : 'USD';
  };
  const [selectedCode, setSelectedCode] = useState(getDefaultSelection);

  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');

  const [shouldConvert, setShouldConvert] = useState<'no' | 'yes'>('no');
  const [conversionRate, setConversionRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);

  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;
  const isCustom = selectedCode === CUSTOM_KEY;
  const selectedPreset = PRESET_CURRENCIES.find((c) => c.code === selectedCode);

  const effectiveNewCurrency = isCustom
    ? customName.trim() && customCode.trim() && customSymbol.trim()
      ? {
          code: customCode.trim().toUpperCase(),
          symbol: customSymbol.trim(),
          name: customName.trim(),
        }
      : null
    : (selectedPreset ?? null);

  const isSameCurrency = effectiveNewCurrency?.code === userProfile.currencyCode;

  const parsedRate = parseFloat(conversionRate);

  const handleSelectPreset = (code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedCode(code);
  };

  const handleSave = async () => {
    if (!effectiveNewCurrency) {
      Toast.show({
        type: 'error',
        text1: isCustom ? 'Incomplete Currency' : 'Select a Currency',
        text2: isCustom ? 'Fill in the name, code, and symbol.' : 'Tap a currency to select it.',
      });
      return;
    }

    if (shouldConvert === 'yes' && (isNaN(parsedRate) || parsedRate <= 0)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Rate',
        text2: 'Enter a valid positive number.',
      });
      return;
    }

    if (shouldConvert === 'yes' && effectiveNewCurrency.code === userProfile.currencyCode) {
      Toast.show({
        type: 'info',
        text1: 'Same Currency',
        text2: 'Amounts are already in this currency. Use "Swap symbol only" instead.',
      });
      return;
    }

    if (shouldConvert === 'yes') {
      setShowConvertConfirm(true);
      return;
    }

    await executeSave();
  };

  const executeSave = async () => {
    if (!effectiveNewCurrency) return;
    setShowConvertConfirm(false);

    try {
      setIsSaving(true);
      await updateCurrencyAndConvert(
        shouldConvert === 'yes' ? parsedRate : 1,
        effectiveNewCurrency.symbol,
        effectiveNewCurrency.code,
        shouldConvert === 'yes'
      );
      Toast.show({
        type: 'success',
        text1: 'Currency Updated',
        text2: `Now using ${effectiveNewCurrency.name} (${effectiveNewCurrency.symbol}).`,
      });
      navigateTab('profile');
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to update currency.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Currency" showBack={true} onLeftPress={() => navigateTab('profile')} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {/* ── Section 1: Select Currency ── */}
        <CurrencyPresetGrid
          selectedCode={selectedCode}
          onSelect={handleSelectPreset}
          isCustom={isCustom}
          currencyCode={userProfile.currencyCode}
          currencySymbol={userProfile.currencySymbol}
        />

        {/* ── Section 2: Custom Currency Form ── */}
        {isCustom && (
          <CustomCurrencyForm
            customName={customName}
            setCustomName={setCustomName}
            customCode={customCode}
            setCustomCode={setCustomCode}
            customSymbol={customSymbol}
            setCustomSymbol={setCustomSymbol}
            placeholderColor={placeholderColor}
            focusedInput={focusedInput}
            setFocusedInput={setFocusedInput}
          />
        )}

        {/* ── Section 3: Conversion ── */}
        <ConversionSection
          shouldConvert={shouldConvert}
          setShouldConvert={setShouldConvert}
          conversionRate={conversionRate}
          setConversionRate={setConversionRate}
          placeholderColor={placeholderColor}
          focusedInput={focusedInput}
          setFocusedInput={setFocusedInput}
          userProfile={userProfile}
          effectiveNewCurrency={effectiveNewCurrency}
        />

        {/* ── Save Button (inside scroll, same as add-subscription) ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || isSameCurrency}
          activeOpacity={0.8}
          className={`items-center justify-center rounded-[6px] bg-primary py-4 ${isSaving || isSameCurrency ? 'opacity-40' : ''}`}>
          <Text className="text-base font-medium text-white dark:text-black">
            {isSaving ? 'Applying...' : 'Apply Currency'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={showConvertConfirm}
        title="Convert All Amounts"
        message={`This will multiply all wallet balances, transactions, budgets and subscriptions by ${parsedRate}. This action cannot be undone.`}
        confirmText="Convert"
        destructive
        onConfirm={executeSave}
        onCancel={() => setShowConvertConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}
