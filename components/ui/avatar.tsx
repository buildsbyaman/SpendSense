import { View, Text as RNText, Image } from 'react-native';
import { useColorScheme } from 'nativewind';

interface AvatarProps {
  name: string;
  avatar: string | null;
  size?: number;
}

const AVATAR_COLORS_LIGHT = ['#e8d5f5', '#d5e8f5', '#d5f5e8', '#f5e8d5', '#f5d5d5'];
const AVATAR_COLORS_DARK = ['#3a2645', '#263a45', '#26453a', '#453a26', '#452626'];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorIndex(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS_LIGHT.length;
}

export function Avatar({ name, avatar, size = 48 }: AvatarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark
    ? AVATAR_COLORS_DARK[getColorIndex(name)]
    : AVATAR_COLORS_LIGHT[getColorIndex(name)];
  const textColor = isDark ? '#e8e8ec' : '#1a1c1b';

  if (avatar) {
    return (
      <Image
        source={{ uri: avatar.startsWith('data:') ? avatar : `data:image/jpeg;base64,${avatar}` }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <RNText
        style={{
          color: textColor,
          fontSize: size * 0.38,
          fontWeight: '600',
          lineHeight: size * 0.46,
        }}>
        {getInitials(name)}
      </RNText>
    </View>
  );
}
