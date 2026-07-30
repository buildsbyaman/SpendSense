import { View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { X } from 'lucide-react-native';

export default function AddTransactionScreen() {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 pb-4 pt-16">
        <Text variant="h3">Add Transaction</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-100"
          activeOpacity={0.7}
        >
          <Icon as={X} size={20} className="text-primary" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
