import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Tags } from 'lucide-react-native';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Categories" showBack={true} />
      </View>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}>
      <View className="mt-20 items-center justify-center px-6">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
          <Icon as={Tags} size={40} className="text-muted opacity-50" />
        </View>
        <Text variant="h3" className="mb-2 text-center">
          Categories
        </Text>
        <Text className="mb-8 text-center text-muted">
          Create and manage custom income and expense categories to keep your finances organised.
        </Text>
        <View className="w-full rounded-3xl bg-surface p-4">
          <Text className="text-center text-sm font-medium text-muted">Coming soon</Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}
