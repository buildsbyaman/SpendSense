import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface SectionCardProps {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, headerRight, children, className = '' }: SectionCardProps) {
  return (
    <View
      className={`mb-4 rounded-xl border border-border bg-surface p-6 shadow-xs ${className}`}>
      {title || headerRight ? (
        <>
          <View className="mb-3 flex-row items-center justify-between">
            {title ? <Text className="text-sm font-medium text-muted">{title}</Text> : <View />}
            {headerRight}
          </View>
          {children}
        </>
      ) : (
        children
      )}
    </View>
  );
}
