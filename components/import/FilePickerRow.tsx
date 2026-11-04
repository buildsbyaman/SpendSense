import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FileUp } from 'lucide-react-native';
import type * as DocumentPicker from 'expo-document-picker';
import type { DetectedFormat } from '@/lib/import/parseFile';

interface Props {
  file: DocumentPicker.DocumentPickerAsset | null;
  detectedFormat?: DetectedFormat | null;
  onPress: () => void;
}

export function FilePickerRow({ file, detectedFormat, onPress }: Props) {
  const getFormatBadge = () => {
    if (!detectedFormat) return null;
    if (detectedFormat === 'json') return 'JSON';
    if (detectedFormat === 'xlsx') return 'Excel';
    if (detectedFormat === 'pdf') return 'PDF';
    return null;
  };

  const badge = getFormatBadge();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-row items-center gap-3 py-1">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Icon as={FileUp} size={18} className="text-foreground" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
            {file ? file.name : 'Select a file to import'}
          </Text>
          {file && badge && (
            <View className="rounded-full bg-foreground px-2 py-0.5">
              <Text className="text-[10px] font-bold text-background uppercase">
                {badge}
              </Text>
            </View>
          )}
        </View>
        <Text className="text-sm font-medium text-muted">
          {file ? 'Tap to change file' : 'JSON, Excel or PDF'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
