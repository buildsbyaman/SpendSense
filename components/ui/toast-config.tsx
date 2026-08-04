import { View, TouchableOpacity } from 'react-native';
import Toast, { ToastConfigParams } from 'react-native-toast-message';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';

export const toastConfig = {
  success: (props: ToastConfigParams<any>) => (
    <View className="w-[90%] max-w-[420px] flex-row items-center rounded-xl border border-border bg-surface px-4 py-4 shadow-lg">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
        <Icon as={CheckCircle2} size={22} className="text-green-600 dark:text-green-400" />
      </View>
      <View className="mr-2 flex-1">
        <Text className="text-base font-semibold text-foreground">{props.text1}</Text>
        {props.text2 ? <Text className="mt-0.5 text-sm text-muted">{props.text2}</Text> : null}
      </View>
      <TouchableOpacity
        onPress={() => Toast.hide()}
        className="rounded-full p-1 active:bg-secondary"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon as={X} size={18} className="text-muted" />
      </TouchableOpacity>
    </View>
  ),
  error: (props: ToastConfigParams<any>) => (
    <View className="w-[90%] max-w-[420px] flex-row items-center rounded-xl border border-border bg-surface px-4 py-3 shadow-lg">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30">
        <Icon as={AlertCircle} size={22} className="text-red-600 dark:text-red-400" />
      </View>
      <View className="mr-2 flex-1">
        <Text className="text-base font-semibold text-foreground">{props.text1}</Text>
        {props.text2 ? <Text className="mt-0.5 text-sm text-muted">{props.text2}</Text> : null}
      </View>
      <TouchableOpacity
        onPress={() => Toast.hide()}
        className="rounded-full p-1 active:bg-secondary"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon as={X} size={18} className="text-muted" />
      </TouchableOpacity>
    </View>
  ),
  info: (props: ToastConfigParams<any>) => (
    <View className="w-[90%] max-w-[420px] flex-row items-center rounded-xl border border-border bg-surface px-4 py-3 shadow-lg">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30">
        <Icon as={Info} size={22} className="text-blue-600 dark:text-blue-400" />
      </View>
      <View className="mr-2 flex-1">
        <Text className="text-base font-semibold text-foreground">{props.text1}</Text>
        {props.text2 ? <Text className="mt-0.5 text-sm text-muted">{props.text2}</Text> : null}
      </View>
      <TouchableOpacity
        onPress={() => Toast.hide()}
        className="rounded-full p-1 active:bg-secondary"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon as={X} size={18} className="text-muted" />
      </TouchableOpacity>
    </View>
  ),
};
