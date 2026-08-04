import { View, TextInput, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Check } from 'lucide-react-native';
import { Avatar } from '@/components/ui/avatar';
import { saveThemePreference } from '@/lib/theme-persistence';

interface Props {
  userProfile: { name: string; avatar: string | null };
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  name: string;
  setName: (v: string) => void;
  error: string | null;
  setError: (v: string | null) => void;
  focusedInput: string | null;
  setFocusedInput: (v: string | null) => void;
  handleSave: () => void;
  handlePickImage: () => void;
  isDark: boolean;
  setColorScheme: (v: 'light' | 'dark') => void;
  placeholderColor: string;
}

export function ProfileCard({
  userProfile,
  isEditing,
  setIsEditing,
  name,
  setName,
  error,
  setError,
  focusedInput,
  setFocusedInput,
  handleSave,
  handlePickImage,
  isDark,
  setColorScheme,
  placeholderColor,
}: Props) {
  return (
    <View className="rounded-xl border border-border bg-surface py-5 shadow-xs">
      {/* Avatar Section */}
      <View className="flex-row items-center gap-4 px-6 py-2">
        <TouchableOpacity activeOpacity={0.7} onPress={handlePickImage}>
          <Avatar name={userProfile.name} avatar={userProfile.avatar} size={56} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold tracking-tight text-foreground">
            {userProfile.name}
          </Text>
          <Text className="text-xs text-muted">Tap photo to change</Text>
        </View>
      </View>

      <View className="my-4 h-[1px] bg-divider" />

      <View className="gap-4">
        {!isEditing ? (
          <View className="flex-row items-center justify-between px-6">
            <Text className="text-sm font-medium text-muted">Name</Text>
            <Text className="text-sm font-semibold text-foreground">{userProfile.name}</Text>
          </View>
        ) : (
          <View className="gap-4 px-6">
            <View className="gap-2">
              <Text className="ml-1 text-sm font-medium text-muted">Profile Name</Text>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError(null);
                }}
                className={`rounded-xl border bg-surface px-4 py-3 text-base text-foreground ${error ? 'border-red-500' : focusedInput === 'name' ? 'border-primary' : 'border-border'}`}
                placeholder="Enter your name"
                placeholderTextColor={placeholderColor}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
              />
              {error && <Text className="ml-4 mt-1 text-xs text-red-500">{error}</Text>}
            </View>

            <View className="mt-2 flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setName(userProfile.name);
                  setError(null);
                  setIsEditing(false);
                }}
                className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-3"
                activeOpacity={0.8}>
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-[6px] bg-primary py-3"
                activeOpacity={0.8}>
                <Icon as={Check} size={16} className="text-white dark:text-black" />
                <Text className="text-sm font-medium text-white dark:text-black">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="h-[1px] bg-divider" />

        {/* Dark Mode */}
        <View className="flex-row items-center justify-between px-6">
          <Text className="text-sm font-medium text-muted">Dark Mode</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              const next = isDark ? 'light' : 'dark';
              setColorScheme(next);
              saveThemePreference(next);
            }}>
            <View
              className={`h-5 w-9 justify-center rounded-full p-0.5 transition-colors duration-200 ${isDark ? 'bg-income' : 'bg-gray-200 dark:bg-gray-800'}`}>
              <View
                className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 dark:bg-black ${isDark ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
