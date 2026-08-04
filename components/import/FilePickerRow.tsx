import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FileUp } from 'lucide-react-native';
import type * as DocumentPicker from 'expo-document-picker';

interface Props {
  file: DocumentPicker.DocumentPickerAsset | null;
  onPress: () => void;
}

export function FilePickerRow({ file, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center gap-3 py-1">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Icon as={FileUp} size={18} className="text-foreground" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {file ? file.name : 'Select a file to import'}
        </Text>
        <Text className="text-sm font-medium text-muted">
          {file ? 'Tap to change file' : 'Browse your device'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
