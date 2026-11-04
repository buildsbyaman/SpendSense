import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Plus } from 'lucide-react-native';

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  buttonText?: string;
  buttonIcon?: any;
  onButtonPress?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, description, buttonText, buttonIcon, onButtonPress, className }: EmptyStateProps) {
  return (
    <View className={className || "mt-20 items-center justify-center px-6"}>
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full border border-border bg-[#F7F7F7] dark:bg-[#1A1A1E]">
        <View className="h-13 w-13 items-center justify-center rounded-full border border-border bg-surface">
          <Icon as={icon} size={24} className="text-foreground" />
        </View>
      </View>
      <Text className="mb-1.5 text-center text-[17px] font-semibold text-foreground">
        {title}
      </Text>
      <Text className="mb-6 text-center text-[13px] text-muted px-4">
        {description}
      </Text>
      {buttonText && onButtonPress && (
        <TouchableOpacity
          className="flex-row items-center gap-2 rounded-full bg-primary px-6 py-3"
          onPress={onButtonPress}
          activeOpacity={0.8}>
          <Icon as={buttonIcon || Plus} size={18} className="text-primary-foreground" />
          <Text className="text-[13px] font-semibold text-primary-foreground">
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
