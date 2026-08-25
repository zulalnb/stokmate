import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Platform, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'success' | 'neutral' | 'danger';

export type BadgeIcon = {
  sfSymbol: SFSymbol;
  ionicon: keyof typeof Ionicons.glyphMap;
};

const VARIANT_CLASSES: Record<
  BadgeVariant,
  { badgeClassName: string; textClassName: string; iconColor: { light: string; dark: string } }
> = {
  success: {
    badgeClassName: 'bg-green-100 dark:bg-green-900/40',
    textClassName: 'text-green-700 dark:text-green-300',
    iconColor: { light: '#15803d', dark: '#86efac' },
  },
  neutral: {
    badgeClassName: 'bg-background-selected dark:bg-background-selected-dark',
    textClassName: 'text-foreground-secondary dark:text-foreground-secondary-dark',
    iconColor: { light: '#60646C', dark: '#B0B4BA' },
  },
  danger: {
    badgeClassName: 'bg-red-100 dark:bg-red-900/40',
    textClassName: 'text-red-700 dark:text-red-300',
    iconColor: { light: '#b91c1c', dark: '#fca5a5' },
  },
};

export type BadgeProps = {
  label: string;
  icon: BadgeIcon;
  variant: BadgeVariant;
};

export function Badge({ label, icon, variant }: BadgeProps) {
  const scheme = useColorScheme();
  const config = VARIANT_CLASSES[variant];
  const iconColor = scheme === 'dark' ? config.iconColor.dark : config.iconColor.light;

  return (
    <View
      className={cn(
        'flex-row items-center gap-1 self-start rounded-full px-2 py-0.5',
        config.badgeClassName,
      )}>
      {Platform.OS === 'ios' ? (
        <SymbolView name={icon.sfSymbol} size={12} tintColor={iconColor} />
      ) : (
        <Ionicons name={icon.ionicon} size={12} color={iconColor} />
      )}
      <ThemedText type="small" className={config.textClassName}>
        {label}
      </ThemedText>
    </View>
  );
}
