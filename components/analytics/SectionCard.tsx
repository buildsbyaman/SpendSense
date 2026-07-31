import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <View
      className={`mb-4 rounded-[32px] border border-gray-100 bg-surface p-5 shadow-xs dark:border-gray-900 ${className}`}>
      {title ? (
        <>
          <Text className="mb-3 text-sm font-medium text-muted">{title}</Text>
          {children}
        </>
      ) : (
        children
      )}
    </View>
  );
}
