import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Check, Database } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { SettingsOptionsMenu } from '@/components/profile/SettingsOptionsMenu';
import { ManageSection } from '@/components/profile/ManageSection';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { saveThemePreference } from '@/lib/theme-persistence';
import { loadDevToolsEnabled, saveDevToolsEnabled, DEV_MODE } from '@/lib/dev-tools';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/ui/avatar';

export default function ProfileScreen(_props: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { userProfile, updateUserProfile, seedDemoData } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const { addListener } = useTabNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [devToolsEnabled, setDevToolsEnabled] = useState(false);
  const tapTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    if (!DEV_MODE) return;
    loadDevToolsEnabled().then(setDevToolsEnabled);
  }, []);

  useEffect(() => {
    return addListener((tabName) => {
      if (tabName === 'profile') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
    });
  }, [addListener]);

  const handleTitlePress = useCallback(() => {
    if (!DEV_MODE) return;
    const now = Date.now();
    const TAP_THRESHOLD = 5;
    const WINDOW_MS = 3000;
    const ts = tapTimestampsRef.current.filter((t) => now - t < WINDOW_MS);
    ts.push(now);
    tapTimestampsRef.current = ts;
    if (ts.length >= TAP_THRESHOLD) {
      tapTimestampsRef.current = [];
      setDevToolsEnabled((prev) => {
        const next = !prev;
        saveDevToolsEnabled(next);
        Toast.show({
          type: 'success',
          text1: next ? 'Developer tools enabled' : 'Developer tools disabled',
          text2: next ? 'Load Demo Data is now visible below.' : 'Load Demo Data is now hidden.',
        });
        return next;
      });
    }
  }, []);

  const isDark = colorScheme === 'dark';
  const placeholderColor = isDark ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let avatarUri: string | null = null;
      if (asset.base64) {
        avatarUri = `data:image/jpeg;base64,${asset.base64}`;
      } else if (asset.uri) {
        avatarUri = asset.uri;
      }
      if (avatarUri) {
        await updateUserProfile({ ...userProfile, avatar: avatarUri });
        Toast.show({
          type: 'success',
          text1: 'Photo Updated',
          text2: 'Your profile photo has been updated.',
        });
      }
    }
  }, [userProfile, updateUserProfile]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name cannot be empty');
      Toast.show({
        type: 'error',
        text1: 'Invalid Name',
        text2: 'Please enter a valid name',
      });
      return;
    }

    await updateUserProfile({ ...userProfile, name: trimmed });
    setError(null);
    setIsEditing(false);
    Toast.show({
      type: 'success',
      text1: 'Profile Updated',
      text2: 'Your name has been updated successfully.',
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header title="Settings" showBack={false} onRightPress={() => setIsMenuOpen(true)} onTitlePress={DEV_MODE ? handleTitlePress : undefined} />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="gap-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
          {/* Avatar Section */}
          <View className="flex-row items-center gap-4 py-2">
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

          <View className="h-[1px] bg-divider" />

          {!isEditing ? (
            /* Read-Only Details Mode */
            <View className="gap-6">
              <View className="flex-row items-center justify-between px-1">
                <Text className="text-sm font-medium text-muted">Name</Text>
                <Text className="text-sm font-semibold text-foreground">{userProfile.name}</Text>
              </View>

              <View className="h-[1px] bg-divider" />

              <View className="flex-row items-center justify-between px-1">
                <Text className="text-sm font-medium text-muted">Dark Mode</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  hitSlop={{top:8,bottom:8,left:8,right:8}}
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
          ) : (
            /* Inline Edit Form Mode */
            <>
              <View className="gap-2">
                <Text className="ml-1 text-sm font-medium text-muted">Profile Name</Text>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError(null);
                  }}
                  className={`rounded-full border-2 bg-gray-50 px-5 py-3.5 text-base text-foreground dark:bg-gray-900 ${error ? 'border-red-500' : focusedInput === 'name' ? 'border-primary' : 'border-transparent'}`}
                  placeholder="Enter your name"
                  placeholderTextColor={placeholderColor}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                />
                {error && <Text className="ml-4 mt-1 text-xs text-red-500">{error}</Text>}
              </View>

              {/* Save / Cancel Buttons */}
              <View className="mt-2 flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setName(userProfile.name);
                    setError(null);
                    setIsEditing(false);
                  }}
                  className="flex-1 items-center justify-center rounded-full bg-secondary py-3"
                  activeOpacity={0.8}>
                  <Text className="text-sm font-semibold text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary py-3"
                  activeOpacity={0.8}>
                  <Icon as={Check} size={16} className="text-white dark:text-black" />
                  <Text className="text-sm font-semibold text-white dark:text-black">Save</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <ManageSection />

        {/* Dev-only: Load Demo Data */}
        {DEV_MODE && devToolsEnabled && (
          <View className="mt-6 rounded-[32px] border border-gray-100 bg-surface p-6 shadow-xs dark:border-gray-900">
            <Text className="mb-4 text-sm font-medium text-muted">Developer</Text>
            <TouchableOpacity
              onPress={() => setConfirmSeed(true)}
              className="flex-row items-center gap-3 py-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-900">
                <Icon as={Database} size={18} className="text-foreground" />
              </View>
              <Text className="flex-1 text-base font-medium text-foreground">Load Demo Data</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <SettingsOptionsMenu
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onEditProfile={() => setIsEditing(true)}
      />

      <ConfirmDialog
        visible={confirmSeed}
        title="Load Demo Data"
        message="This will replace all existing data with 3 wallets and ~148 transactions spanning 12 months."
        confirmText="Load"
        onConfirm={async () => {
          setConfirmSeed(false);
          await seedDemoData();
          Toast.show({
            type: 'success',
            text1: 'Demo Data Loaded',
            text2: '3 wallets, ~148 transactions seeded.',
          });
        }}
        onCancel={() => setConfirmSeed(false)}
      />
    </KeyboardAvoidingView>
  );
}
