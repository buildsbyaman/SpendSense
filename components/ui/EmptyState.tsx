import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus } from 'lucide-react-native';

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export function EmptyState({ icon, title, description, buttonText, onButtonPress }: EmptyStateProps) {
  return (
    <View className="mt-20 items-center justify-center px-6">
      <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-secondary">
        <Icon as={icon} size={40} className="text-muted opacity-50" />
      </View>
      <Text variant="large" className="mb-2 text-center text-foreground">
        {title}
      </Text>
      <Text className="mb-8 text-center text-muted">
        {description}
      </Text>
      {buttonText && onButtonPress && (
        <TouchableOpacity
          className="flex-row items-center gap-2 rounded-xl bg-primary px-6 py-3.5"
          onPress={onButtonPress}
          activeOpacity={0.7}>
          <Icon as={Plus} size={20} className="text-white dark:text-black" />
          <Text className="text-base font-semibold text-white dark:text-black">
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
