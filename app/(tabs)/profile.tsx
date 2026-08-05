import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '@/components/ui/header';
import { Text } from '@/components/ui/text';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import Toast from 'react-native-toast-message';
import { SettingsOptionsMenu } from '@/components/profile/SettingsOptionsMenu';
import { ManageSection } from '@/components/profile/ManageSection';
import { useColorScheme } from 'nativewind';
import { PLACEHOLDER_COLORS } from '@/lib/theme';
import { loadDevToolsEnabled, saveDevToolsEnabled, DEV_MODE } from '@/lib/dev-tools';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTabNavigation } from '@/context/TabNavigationContext';
import { useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { sanitizeAvatarUri } from '@/utils/avatar';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { DevToolsSection } from '@/components/profile/DevToolsSection';
import { useAppLock } from '@/context/AppLockContext';
import { canUseAuthentication } from '@/lib/biometric';

export default function ProfileScreen(_props: { isActive?: boolean }) {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { userProfile, updateUserProfile, seedDemoData } = useApp();
  const { enabled: appLockEnabled, enable: enableAppLock, disable: disableAppLock } = useAppLock();
  const [isAppLockChanging, setIsAppLockChanging] = useState(false);
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

  // Keep the local draft in sync with the source of truth whenever the name
  // changes elsewhere (onboarding, demo-data reset), but never while the user
  // is mid-edit.
  useEffect(() => {
    if (!isEditing) setName(userProfile.name);
  }, [userProfile.name, isEditing]);

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
    try {
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
          avatarUri = sanitizeAvatarUri(`data:image/jpeg;base64,${asset.base64}`);
        }
        if (!avatarUri && asset.uri) {
          avatarUri = sanitizeAvatarUri(asset.uri);
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
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Photo Failed',
        text2: 'Could not update your profile photo.',
      });
    }
  }, [userProfile, updateUserProfile]);

  const savingRef = useRef(false);

  const handleSave = async () => {
    if (savingRef.current) return;

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

    savingRef.current = true;
    try {
      await updateUserProfile({ ...userProfile, name: trimmed });
      setError(null);
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your name has been updated successfully.',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not save your profile.',
      });
    } finally {
      savingRef.current = false;
    }
  };

  const handleAppLockToggle = useCallback(async () => {
    if (isAppLockChanging) return;
    const supported = await canUseAuthentication();
    if (!supported) {
      Toast.show({
        type: 'error',
        text1: 'Not Available',
        text2: 'Set up a screen lock (PIN, pattern, or biometric) on your device first.',
      });
      return;
    }
    setIsAppLockChanging(true);
    try {
      const ok = appLockEnabled ? await disableAppLock() : await enableAppLock();
      Toast.show({
        type: ok ? 'success' : 'error',
        text1: ok ? (appLockEnabled ? 'App Lock Disabled' : 'App Lock Enabled') : 'Authentication Failed',
        text2: ok
          ? appLockEnabled
            ? 'Your data is no longer locked on app open.'
            : 'SpendSense will now lock whenever it leaves the screen.'
          : 'Could not unlock. Try again.',
      });
    } finally {
      setIsAppLockChanging(false);
    }
  }, [appLockEnabled, enableAppLock, disableAppLock, isAppLockChanging]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5">
        <Header
          title="Settings"
          showBack={false}
          onRightPress={() => setIsMenuOpen(true)}
          onTitlePress={DEV_MODE ? handleTitlePress : undefined}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <ProfileCard
          userProfile={userProfile}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          name={name}
          setName={setName}
          error={error}
          setError={setError}
          focusedInput={focusedInput}
          setFocusedInput={setFocusedInput}
          handleSave={handleSave}
          handlePickImage={handlePickImage}
          isDark={isDark}
          setColorScheme={setColorScheme}
          placeholderColor={placeholderColor}
          appLockEnabled={appLockEnabled}
          isAppLockChanging={isAppLockChanging}
          onAppLockToggle={() => void handleAppLockToggle()}
        />

        <ManageSection />

        {/* Dev-only: Load Demo Data */}
        {DEV_MODE && devToolsEnabled && (
          <DevToolsSection onSeed={() => setConfirmSeed(true)} />
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
