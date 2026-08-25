import { TextInput, type TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';

export type InputProps = TextInputProps & {
  className?: string;
};

export function Input({ className, style, ...rest }: InputProps) {
  return (
    <TextInput
      className={cn(
        'h-12 rounded-lg border border-background-selected px-4 text-base text-text placeholder:text-text-secondary dark:border-background-selected-dark dark:text-text-dark',
        className,
      )}
      style={[{ borderCurve: 'continuous' }, style]}
      {...rest}
    />
  );
}
