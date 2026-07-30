import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text variant="h1">SpendSense</Text>
      <Text className="mt-2 text-muted">Welcome back</Text>
    </View>
  );
}
