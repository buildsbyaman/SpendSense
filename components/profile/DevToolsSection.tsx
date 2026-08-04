import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Database } from 'lucide-react-native';

interface Props {
  onSeed: () => void;
}

export function DevToolsSection({ onSeed }: Props) {
  return (
    <View className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
      <Text className="mb-4 text-sm font-medium text-muted">Developer</Text>
      <TouchableOpacity
        onPress={onSeed}
        className="flex-row items-center gap-3 py-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Icon as={Database} size={18} className="text-foreground" />
        </View>
        <Text className="flex-1 text-base font-medium text-foreground">Load Demo Data</Text>
      </TouchableOpacity>
    </View>
  );
}
