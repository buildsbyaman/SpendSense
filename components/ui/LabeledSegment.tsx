import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import AnimatedSegment, { type SegmentOption } from '@/components/ui/animated-segment';

export function LabeledSegment<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View>
      <Text className="mb-3 text-sm font-medium text-muted">{label}</Text>
      <AnimatedSegment
        options={options}
        selectedValue={value}
        onChange={(v) => onChange(v as T)}
      />
    </View>
  );
}
