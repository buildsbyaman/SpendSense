import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft, MoreVertical, type LucideIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBack?: boolean;
}

export function Header({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  showBack = false,
}: HeaderProps) {
  const router = useRouter();

  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else if (showBack && router.canGoBack()) {
      router.back();
    }
  };

  const LeftIconToUse = leftIcon || (showBack ? ChevronLeft : null);
  const RightIconToUse = rightIcon || (onRightPress ? MoreVertical : null);

  return (
    <View className="mb-4 flex-row items-center justify-between px-2">
      {/* Left Action */}
      <View className="w-10 items-start">
        {LeftIconToUse && (
          <TouchableOpacity
            onPress={handleLeftPress}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-xs"
            activeOpacity={0.7}>
            <Icon as={LeftIconToUse} size={18} className="text-foreground" />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text className="text-lg font-semibold text-foreground">{title}</Text>

      {/* Right Action */}
      <View className="w-10 items-end">
        {RightIconToUse && (
          <TouchableOpacity
            onPress={onRightPress}
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-xs"
            activeOpacity={0.7}>
            <Icon as={RightIconToUse} size={18} className="text-foreground" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
