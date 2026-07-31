import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Repeat } from 'lucide-react-native';

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: 120,
        paddingHorizontal: 20,
      }}>
      <Header title="Subscriptions" showBack={true} />

      <View className="mt-20 items-center justify-center px-6">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
          <Icon as={Repeat} size={40} className="text-muted opacity-50" />
        </View>
        <Text variant="h3" className="mb-2 text-center">
          Subscriptions
        </Text>
        <Text className="mb-8 text-center text-muted">
          Track and manage your recurring subscriptions like Netflix, Spotify, and more.
        </Text>
        <View className="w-full rounded-3xl bg-surface p-4">
          <Text className="text-center text-sm font-medium text-muted">Coming soon</Text>
        </View>
      </View>
    </ScrollView>
  );
}
