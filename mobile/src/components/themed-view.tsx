import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

const BG_CLASSES = {
  background: 'bg-background dark:bg-background-dark',
  backgroundElement: 'bg-background-element dark:bg-background-element-dark',
  backgroundSelected: 'bg-background-selected dark:bg-background-selected-dark',
} as const;

export type ThemedViewProps = ViewProps & {
  className?: string;
  type?: keyof typeof BG_CLASSES;
};

export function ThemedView({ className, type = 'background', ...rest }: ThemedViewProps) {
  return <View className={cn(BG_CLASSES[type], className)} {...rest} />;
}
