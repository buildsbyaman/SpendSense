import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { AlertTriangle } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-4 bg-background px-6">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <Icon as={AlertTriangle} size={36} className="text-muted" />
        </View>
        <Text variant="h3" className="text-foreground text-center">
          Page not found
        </Text>
        <Text className="text-center text-muted">This screen doesn't exist.</Text>
        <Link href="/" className="mt-2">
          <Text className="font-semibold text-primary">Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
