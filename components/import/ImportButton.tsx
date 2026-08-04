import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FileUp } from 'lucide-react-native';

interface Props {
  disabled: boolean;
  parsing: boolean;
  importing: boolean;
  noData: boolean;
  onPress: () => void;
}

export function ImportButton({ disabled, parsing, importing, noData, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      className={`mb-4 flex-row items-center justify-center gap-2 rounded-xl py-4 ${
        disabled ? 'bg-secondary' : 'bg-primary'
      }`}>
      <Icon
        as={FileUp}
        size={18}
        className={disabled ? 'text-muted' : 'text-white dark:text-black'}
      />
      <Text
        className={`text-base font-medium ${
          disabled ? 'text-muted' : 'text-white dark:text-black'
        }`}>
        {parsing ? 'Parsing file...' : importing ? 'Importing...' : noData ? 'No Data to Import' : 'Import'}
      </Text>
    </TouchableOpacity>
  );
}
