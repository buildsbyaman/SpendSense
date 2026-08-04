import { View, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Info } from 'lucide-react-native';
import AnimatedSegment from '@/components/ui/animated-segment';
import { LayoutAnimation } from 'react-native';
import { formatNumber } from '@/utils/wallet';

interface Props {
  shouldConvert: 'no' | 'yes';
  setShouldConvert: (v: 'no' | 'yes') => void;
  conversionRate: string;
  setConversionRate: (v: string) => void;
  placeholderColor: string;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
  userProfile: { currencyCode: string; currencySymbol: string };
  effectiveNewCurrency: { code: string; symbol: string } | null;
}

export function ConversionSection({
  shouldConvert,
  setShouldConvert,
  conversionRate,
  setConversionRate,
  placeholderColor,
  focusedInput,
  setFocusedInput,
  userProfile,
  effectiveNewCurrency,
}: Props) {
  const parsedRate = parseFloat(conversionRate);
  const previewAmount = formatNumber(10 * (parsedRate || 1));

  return (
    <View className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
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
              className={`rounded-xl border bg-surface px-4 py-3 text-base font-semibold text-foreground ${focusedInput === 'rate' ? 'border-primary' : 'border-border'}`}
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

          <View className="flex-row items-start gap-2.5 rounded-xl bg-secondary p-4">
            <Icon as={Info} size={14} className="mt-0.5 text-muted" />
            <Text className="flex-1 text-xs leading-4 text-muted">
              All wallets, transactions, budgets and subscriptions will be permanently
              multiplied by this rate.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
