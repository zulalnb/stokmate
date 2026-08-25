import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'react-native';
import { BaseToast, type ToastConfig, type ToastConfigParams } from 'react-native-toast-message';

const COLORS = {
  background: { light: '#F0F0F3', dark: '#212225' },
  text: { light: '#000000', dark: '#ffffff' },
  textSecondary: { light: '#60646C', dark: '#B0B4BA' },
  accent: '#3c87f7',
  danger: '#DC2626',
} as const;

function AppToast({
  accentColor,
  icon,
  ...params
}: ToastConfigParams<unknown> & { accentColor: string; icon: keyof typeof Ionicons.glyphMap }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <BaseToast
      {...params}
      style={{
        borderLeftColor: accentColor,
        backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light,
        borderRadius: 16,
        height: 'auto',
        minHeight: 60,
        paddingVertical: 8,
      }}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      text1Style={{
        fontSize: 14,
        fontWeight: '700',
        color: isDark ? COLORS.text.dark : COLORS.text.light,
      }}
      text2Style={{
        fontSize: 13,
        fontWeight: '500',
        color: isDark ? COLORS.textSecondary.dark : COLORS.textSecondary.light,
      }}
      renderLeadingIcon={() => (
        <Ionicons name={icon} size={22} color={accentColor} style={{ alignSelf: 'center', marginLeft: 12 }} />
      )}
    />
  );
}

export const toastConfig: ToastConfig = {
  success: (params) => <AppToast {...params} accentColor={COLORS.accent} icon="checkmark-circle" />,
  error: (params) => <AppToast {...params} accentColor={COLORS.danger} icon="alert-circle" />,
};
