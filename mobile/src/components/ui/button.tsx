import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<ButtonVariant, { buttonClassName: string; textClassName?: string }> = {
  primary: { buttonClassName: 'bg-accent', textClassName: 'text-white' },
  secondary: { buttonClassName: 'bg-background-element dark:bg-background-element-dark' },
};

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;
};

export function Button({
  title,
  loading,
  variant = 'primary',
  disabled,
  className,
  style,
  ...rest
}: ButtonProps) {
  const config = VARIANT_CLASSES[variant];

  return (
    <Pressable
      className={cn(
        'h-12 items-center justify-center rounded-lg active:opacity-80 disabled:opacity-60',
        config.buttonClassName,
        className,
      )}
      style={(state) => [
        { borderCurve: 'continuous' as const },
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled || loading}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : undefined} />
      ) : (
        <ThemedText type="smallBold" className={config.textClassName}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}
