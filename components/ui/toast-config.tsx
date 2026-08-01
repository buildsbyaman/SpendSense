import { View, TouchableOpacity } from 'react-native';
import Toast, { ToastConfigParams } from 'react-native-toast-message';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

export const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <View className="flex-row items-center w-[90%] bg-surface px-4 py-4 rounded-2xl shadow-sm">
      <View className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center mr-3">
        <Icon as={CheckCircle2} size={22} className="text-green-600 dark:text-green-400" />
      </View>
      <View className="flex-1 mr-2">
        <Text className="text-base font-semibold text-foreground">{props.text1}</Text>
        {props.text2 ? <Text className="text-sm text-muted mt-0.5">{props.text2}</Text> : null}
      </View>
      <TouchableOpacity 
        onPress={() => Toast.hide()}
        className="p-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon as={X} size={18} className="text-muted" />
      </TouchableOpacity>
    </View>
  ),
  error: (props: ToastConfigParams<any>) => (
    <View className="flex-row items-center w-[90%] bg-surface px-4 py-3 rounded-2xl shadow-sm">
      <View className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 items-center justify-center mr-3">
        <Icon as={AlertCircle} size={22} className="text-red-600 dark:text-red-400" />
      </View>
      <View className="flex-1 mr-2">
        <Text className="text-base font-semibold text-foreground">{props.text1}</Text>
        {props.text2 ? <Text className="text-sm text-muted mt-0.5">{props.text2}</Text> : null}
      </View>
      <TouchableOpacity 
        onPress={() => Toast.hide()}
        className="p-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon as={X} size={18} className="text-muted" />
      </TouchableOpacity>
    </View>
  ),
  info: (props: ToastConfigParams<any>) => (
    <View className="flex-row items-center w-[90%] bg-surface px-4 py-3 rounded-2xl shadow-sm">
      <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mr-3">
        <Icon as={Info} size={22} className="text-blue-600 dark:text-blue-400" />
      </View>
      <View className="flex-1 mr-2">
        <Text className="text-base font-semibold text-foreground">{props.text1}</Text>
        {props.text2 ? <Text className="text-sm text-muted mt-0.5">{props.text2}</Text> : null}
      </View>
      <TouchableOpacity 
        onPress={() => Toast.hide()}
        className="p-1 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon as={X} size={18} className="text-muted" />
      </TouchableOpacity>
    </View>
  ),
};
