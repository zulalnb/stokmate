import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/utils';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  loading?: boolean;
  className?: string;
};

export function Button({ title, loading, disabled, className, style, ...rest }: ButtonProps) {
  return (
    <Pressable
      className={cn(
        'h-12 items-center justify-center rounded-lg bg-accent active:opacity-80 disabled:opacity-60',
        className,
      )}
      style={(state) => [
        { borderCurve: 'continuous' as const },
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled || loading}
      {...rest}>
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <ThemedText type="smallBold" className="text-white">
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}
