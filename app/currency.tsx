import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Info, Check, Plus } from 'lucide-react-native';

import { useApp } from '@/context/AppContext';
import { formatNumber } from '@/utils/wallet';
import AnimatedSegment from '@/components/ui/animated-segment';
import Toast from 'react-native-toast-message';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import { useTabNavigation } from '@/context/TabNavigationContext';

const PRESET_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];

const CUSTOM_KEY = '__CUSTOM__';

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

  const parsedRate = parseFloat(conversionRate);
  const previewAmount = formatNumber(10 * (parsedRate || 1));

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
        keyboardShouldPersistTaps="handled">
        {/* ── Section 1: Select Currency ── */}
        <View className="mb-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-1 text-sm font-medium text-muted">Active Currency</Text>
          <Text className="mb-4 text-lg font-bold text-foreground">
            {userProfile.currencyCode} · {userProfile.currencySymbol}
          </Text>

          <Text className="mb-3 text-sm font-medium text-muted">Switch to</Text>

          {/* Pill chips grid */}
          <View className="flex-row flex-wrap gap-2">
            {PRESET_CURRENCIES.map((c) => {
              const isSelected = selectedCode === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  onPress={() => handleSelectPreset(c.code)}
                  activeOpacity={0.75}
                  className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-gray-200 bg-transparent dark:border-gray-800'
                  }`}>
                  <Text
                    className={`text-sm font-bold ${isSelected ? 'text-white dark:text-black' : 'text-foreground'}`}>
                    {c.symbol}
                  </Text>
                  <Text
                    className={`text-xs font-semibold ${isSelected ? 'text-white dark:text-black' : 'text-muted'}`}>
                    {c.code}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* + Custom chip */}
            <TouchableOpacity
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedCode(CUSTOM_KEY);
              }}
              activeOpacity={0.75}
              className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
                isCustom
                  ? 'border-primary bg-primary'
                  : 'border-dashed border-gray-300 bg-transparent dark:border-gray-700'
              }`}>
              <Icon
                as={isCustom ? Check : Plus}
                size={13}
                className={isCustom ? 'text-white dark:text-black' : 'text-muted'}
              />
              <Text
                className={`text-xs font-semibold ${isCustom ? 'text-white dark:text-black' : 'text-muted'}`}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected preview row */}
          {!isCustom && selectedPreset && (
            <View className="mt-4 flex-row items-center gap-3">
              <View className={`h-[1px] flex-1 bg-divider`} />
              <Text className="text-xs text-muted">{selectedPreset.name}</Text>
              <View className={`h-[1px] flex-1 bg-divider`} />
            </View>
          )}
        </View>

        {/* ── Section 2: Custom Currency Form ── */}
        {isCustom && (
          <View className="mb-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
            <Text className="mb-4 text-sm font-medium text-muted">Custom Currency Details</Text>

            <View className="gap-4">
              <View>
                <Text className="mb-2 ml-1 text-sm text-muted">Full Name</Text>
                <TextInput
                  className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base text-foreground dark:bg-gray-900 ${focusedInput === 'cn' ? 'border-primary' : 'border-transparent'}`}
                  placeholder="e.g. Bitcoin"
                  placeholderTextColor={placeholderColor}
                  value={customName}
                  onChangeText={setCustomName}
                  onFocus={() => setFocusedInput('cn')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-2 ml-1 text-sm text-muted">Short Code</Text>
                  <TextInput
                    className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base text-foreground dark:bg-gray-900 ${focusedInput === 'cc' ? 'border-primary' : 'border-transparent'}`}
                    placeholder="BTC"
                    placeholderTextColor={placeholderColor}
                    autoCapitalize="characters"
                    maxLength={6}
                    value={customCode}
                    onChangeText={setCustomCode}
                    onFocus={() => setFocusedInput('cc')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-2 ml-1 text-sm text-muted">Symbol</Text>
                  <TextInput
                    className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base text-foreground dark:bg-gray-900 ${focusedInput === 'cs' ? 'border-primary' : 'border-transparent'}`}
                    placeholder="₿"
                    placeholderTextColor={placeholderColor}
                    maxLength={5}
                    value={customSymbol}
                    onChangeText={setCustomSymbol}
                    onFocus={() => setFocusedInput('cs')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Section 3: Conversion ── */}
        <View className="mb-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          <Text className="mb-2 ml-1 text-sm text-muted">Conversion Strategy</Text>

          <AnimatedSegment<'no' | 'yes'>
            options={[
              { label: 'Swap symbol only', value: 'no' },
              { label: 'Convert amounts', value: 'yes' },
            ]}
            selectedValue={shouldConvert}
            onChange={(val) => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShouldConvert(val);
            }}
          />

          {shouldConvert === 'yes' && (
            <View className="mt-5 gap-4">
              <View>
                <Text className="mb-2 ml-1 text-sm text-muted">
                  1 {userProfile.currencyCode} = ? {effectiveNewCurrency?.code ?? '—'}
                </Text>
                <TextInput
                  className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base font-semibold text-foreground dark:bg-gray-900 ${focusedInput === 'rate' ? 'border-primary' : 'border-transparent'}`}
                  placeholder="e.g. 83.50"
                  placeholderTextColor={placeholderColor}
                  keyboardType="decimal-pad"
                  value={conversionRate}
                  onChangeText={setConversionRate}
                  onFocus={() => setFocusedInput('rate')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {conversionRate.trim() !== '' && parsedRate > 0 && effectiveNewCurrency && (
                <Text className="text-center text-xs text-muted">
                  {userProfile.currencySymbol}10.00 → {effectiveNewCurrency.symbol}
                  {previewAmount}
                </Text>
              )}

              <View className="flex-row items-start gap-2.5 rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
                <Icon as={Info} size={14} className="mt-0.5 text-muted" />
                <Text className="flex-1 text-xs leading-4 text-muted">
                  All wallets, transactions, budgets and subscriptions will be permanently
                  multiplied by this rate.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Save Button (inside scroll, same as add-subscription) ── */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
          className={`items-center justify-center rounded-full bg-primary py-4 ${isSaving ? 'opacity-50' : ''}`}>
          <Text className="text-base font-medium text-white dark:text-black">
            {isSaving ? 'Applying...' : 'Apply Currency'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
