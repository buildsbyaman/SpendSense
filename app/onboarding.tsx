import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useApp } from '@/context/AppContext';
import { useState, useCallback } from 'react';
import { useRouter, Redirect } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from 'nativewind';
import { Camera, Shield, Wallet, PieChart } from 'lucide-react-native';
import { Avatar } from '@/components/ui/avatar';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { completeOnboarding, userProfile } = useApp();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (asset.base64) {
        setAvatar(`data:image/jpeg;base64,${asset.base64}`);
      } else if (asset.uri) {
        setAvatar(asset.uri);
      }
    }
  }, []);

  const handleContinue = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    completeOnboarding({ name: trimmed, avatar });
    
    Toast.show({
      type: 'success',
      text1: 'Welcome aboard!',
      text2: 'You have been successfully onboarded. Start using SpendSense!',
    });

    router.replace('/');
  };

  const canContinue = name.trim().length > 0;

  if (userProfile.hasOnboarded) return <Redirect href="/" />;

  const bullets = [
    {
      icon: Shield,
      title: 'Total Privacy',
      text: 'Your data stays on your device — completely offline.',
    },
    {
      icon: Wallet,
      title: 'All Accounts',
      text: 'Track income & expenses across all your wallets.',
    },
    {
      icon: PieChart,
      title: 'Smart Insights',
      text: 'Set budgets, subscriptions, and see clear charts.',
    },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 16 }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled">
        <View className="mb-8 mt-12">
          <Text className="text-4xl font-extrabold tracking-tight text-foreground">Welcome.</Text>
          <Text className="mt-3 text-lg leading-7 text-muted">
            Let's set up your personal finance tracker. Private, simple, and always offline.
          </Text>
        </View>

        {/* Avatar + Name Row */}
        <View className="mt-6 flex-row items-center gap-5">
          <TouchableOpacity activeOpacity={0.7} onPress={handlePickImage} className="relative">
            <Avatar name={name || 'User'} avatar={avatar} size={76} />
            <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-[3px] border-background bg-primary">
              <Icon as={Camera} size={14} className="text-white dark:text-black" />
            </View>
          </TouchableOpacity>
          <View className="flex-1 gap-1.5">
            <Text className="ml-1 text-sm font-semibold text-foreground">Your full name</Text>
            <TextInput
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (error) setError(null);
              }}
              className="rounded-2xl border border-gray-200 bg-surface px-4 py-3.5 text-base font-medium text-foreground outline-none focus:border-primary dark:border-gray-800"
              placeholder="e.g. Aman Kumar"
              placeholderTextColor={isDark ? '#8a8a94' : '#9ca3af'}
              autoFocus
              style={Platform.OS === 'web' ? ({ outline: 'none' } as any) : {}}
            />
          </View>
        </View>
        {error && <Text className="mt-2 text-sm font-medium text-red-500">{error}</Text>}

        {/* Feature Bullets */}
        <View className="mt-12 gap-8">
          {bullets.map((bullet, i) => (
            <View key={i} className="flex-row items-start gap-4">
              <View className="bg-primary/10 mt-1 h-10 w-10 items-center justify-center rounded-full">
                <Icon as={bullet.icon} size={20} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{bullet.title}</Text>
                <Text className="mt-1 text-sm leading-5 text-muted">{bullet.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Get Started */}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canContinue}
          className={`mb-8 mt-10 flex-row items-center justify-center gap-2 rounded-full py-4 shadow-sm ${
            canContinue ? 'bg-primary' : 'bg-gray-100 dark:bg-gray-900'
          }`}
          activeOpacity={0.8}>
          <Text
            className={`text-lg font-bold ${canContinue ? 'text-white dark:text-black' : 'text-muted'}`}>
            Get Started
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
