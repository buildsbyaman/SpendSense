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
  rightIcon = MoreVertical,
  onLeftPress, 
  onRightPress,
  showBack = false
}: HeaderProps) {
  const router = useRouter();

  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else if (showBack) {
      router.back();
    }
  };

  const LeftIconToUse = leftIcon || (showBack ? ChevronLeft : null);

  return (
    <View className="flex-row items-center justify-between mb-8 px-2">
      {/* Left Action */}
      <View className="w-12 items-start">
        {LeftIconToUse && (
          <TouchableOpacity 
            onPress={handleLeftPress}
            className="w-12 h-12 bg-surface rounded-full items-center justify-center shadow-xs border border-border"
            activeOpacity={0.7}
          >
            <Icon as={LeftIconToUse} size={20} className="text-foreground" />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text className="text-xl font-semibold text-foreground">{title}</Text>

      {/* Right Action */}
      <View className="w-12 items-end">
        {rightIcon && (
          <TouchableOpacity 
            onPress={onRightPress}
            className="w-12 h-12 bg-surface rounded-full items-center justify-center shadow-xs border border-border"
            activeOpacity={0.7}
          >
            <Icon as={rightIcon} size={20} className="text-foreground" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
