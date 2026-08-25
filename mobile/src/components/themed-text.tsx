import { Text, type TextProps } from 'react-native';

import { cn } from '@/lib/utils';

const TYPE_CLASSES = {
  default: 'text-base leading-6 font-medium',
  title: 'text-5xl leading-[52px] font-semibold',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  subtitle: 'text-3xl leading-[44px] font-semibold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-accent',
  code: 'text-xs font-mono font-medium',
} as const;

const COLOR_CLASSES = {
  text: 'text-foreground dark:text-foreground-dark',
  textSecondary: 'text-foreground-secondary dark:text-foreground-secondary-dark',
} as const;

export type ThemedTextProps = TextProps & {
  className?: string;
  type?: keyof typeof TYPE_CLASSES;
  themeColor?: keyof typeof COLOR_CLASSES;
};

export function ThemedText({ className, type = 'default', themeColor = 'text', ...rest }: ThemedTextProps) {
  return <Text className={cn(COLOR_CLASSES[themeColor], TYPE_CLASSES[type], className)} {...rest} />;
}
