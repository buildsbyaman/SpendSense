import { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react-native';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { InAppModal } from '@/components/ui/InAppModal';
import { PLACEHOLDER_COLORS } from '@/lib/theme';

interface PasswordModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  mode: 'create' | 'enter';
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (password: string) => void;
}

export function PasswordModal({
  visible,
  title,
  subtitle,
  mode,
  busy = false,
  error,
  onCancel,
  onSubmit,
}: PasswordModalProps) {
  const { colorScheme } = useColorScheme();
  const placeholderColor =
    colorScheme === 'dark' ? PLACEHOLDER_COLORS.dark : PLACEHOLDER_COLORS.light;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setPassword('');
      setConfirm('');
      setShow(false);
      setLocalError(null);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const displayError = localError;

  const handleSubmit = () => {
    if (busy) return;
    if (mode === 'create') {
      if (password.length < 4) {
        setLocalError('Use at least 4 characters.');
        return;
      }
      if (password !== confirm) {
        setLocalError('Passwords do not match.');
        return;
      }
    } else if (password.length === 0) {
      setLocalError('Enter the backup password.');
      return;
    }
    setLocalError(null);
    onSubmit(password);
  };

  const { isRendered, animatedStyle, backdropStyle } = useModalAnimation({
    visible,
    type: 'scale',
  });

  return (
    <InAppModal visible={isRendered} onRequestClose={busy ? () => {} : onCancel}>
      <TouchableOpacity
        style={{ zIndex: 9999, elevation: 99 }}
        className="flex-1 items-center justify-center px-6"
        activeOpacity={1}
        onPress={busy ? undefined : onCancel}>
        <Animated.View
          style={[
            { backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            backdropStyle,
          ]}
        />
        <Animated.View style={[animatedStyle, { width: '100%', alignItems: 'center' }]}>
          <View
            className="w-full rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onStartShouldSetResponder={() => true}>
            <View className="mb-5 h-16 w-16 items-center justify-center self-center rounded-full bg-secondary">
              <Icon as={Lock} size={28} className="text-primary" />
            </View>

            <Text variant="h3" className="mb-1 text-center text-foreground">
              {title}
            </Text>
            {subtitle ? (
              <Text className="mb-6 text-center text-sm text-muted">{subtitle}</Text>
            ) : (
              <View className="mb-6" />
            )}

            <TextInput
              ref={inputRef}
              className="rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
              placeholder={mode === 'create' ? 'Backup password' : 'Password'}
              placeholderTextColor={placeholderColor}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (displayError) setLocalError(null);
              }}
              editable={!busy}
            />

            {mode === 'create' && (
              <TextInput
                className="mt-3 rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground"
                placeholder="Confirm password"
                placeholderTextColor={placeholderColor}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                value={confirm}
                onChangeText={(text) => {
                  setConfirm(text);
                  if (displayError) setLocalError(null);
                }}
                editable={!busy}
              />
            )}

            <TouchableOpacity
              onPress={() => setShow((s) => !s)}
              className="mt-3 flex-row items-center gap-1.5 self-end"
              disabled={busy}>
              <Icon as={show ? EyeOff : Eye} size={14} className="text-muted" />
              <Text className="text-xs text-muted">{show ? 'Hide' : 'Show'} password</Text>
            </TouchableOpacity>

            {displayError && (
              <View className="mt-3 flex-row items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 dark:bg-red-900/20">
                <Icon as={ShieldAlert} size={14} className="text-red-500" />
                <Text className="flex-1 text-xs text-red-500">{displayError}</Text>
              </View>
            )}

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={onCancel}
                disabled={busy}
                className="flex-1 items-center justify-center rounded-[6px] bg-secondary py-3.5"
                activeOpacity={0.8}>
                <Text className="text-sm font-semibold text-foreground">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={busy}
                className="flex-1 items-center justify-center rounded-[6px] bg-primary py-3.5"
                activeOpacity={0.8}>
                {busy ? (
                  <ActivityIndicator color={colorScheme === 'dark' ? '#000' : '#fff'} size="small" />
                ) : (
                  <Text className="text-sm font-semibold text-white dark:text-black">
                    {mode === 'create' ? 'Encrypt & Backup' : 'Unlock'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </InAppModal>
  );
}
