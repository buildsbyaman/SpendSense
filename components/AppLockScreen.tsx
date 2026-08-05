import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Lock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useAppLock } from '@/context/AppLockContext';

export function AppLockScreen() {
  const { locked, isAuthenticating, unlock } = useAppLock();
  const { colorScheme } = useColorScheme();

  if (!locked) return null;

  return (
    <View className="absolute inset-0 z-[999] items-center justify-center bg-background">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Icon as={Lock} size={28} className="text-foreground" />
      </View>
      <Text className="mt-4 text-lg font-bold tracking-tight text-foreground">SpendSense</Text>
      <Text className="mt-1 text-sm text-muted">Unlock to view your data</Text>
      <TouchableOpacity
        onPress={() => void unlock()}
        disabled={isAuthenticating}
        activeOpacity={0.8}
        className="mt-6 flex-row items-center justify-center gap-2 rounded-[6px] bg-primary px-6 py-3.5">
        {isAuthenticating ? (
          <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} />
        ) : (
          <Icon as={Lock} size={16} className="text-white dark:text-black" />
        )}
        <Text className="text-sm font-medium text-white dark:text-black">Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}