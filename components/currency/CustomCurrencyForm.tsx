import { View, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';

interface Props {
  customName: string;
  setCustomName: (v: string) => void;
  customCode: string;
  setCustomCode: (v: string) => void;
  customSymbol: string;
  setCustomSymbol: (v: string) => void;
  placeholderColor: string;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
}

export function CustomCurrencyForm({
  customName,
  setCustomName,
  customCode,
  setCustomCode,
  customSymbol,
  setCustomSymbol,
  placeholderColor,
  focusedInput,
  setFocusedInput,
}: Props) {
  return (
    <View className="mb-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
      <Text className="mb-4 text-sm font-medium text-muted">Custom Currency Details</Text>

      <View className="gap-4">
        <View>
          <Text className="mb-2 ml-1 text-sm text-muted">Full Name</Text>
          <TextInput
            className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${focusedInput === 'cn' ? 'border-primary' : 'border-border'}`}
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
              className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${focusedInput === 'cc' ? 'border-primary' : 'border-border'}`}
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
              className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${focusedInput === 'cs' ? 'border-primary' : 'border-border'}`}
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
  );
}
