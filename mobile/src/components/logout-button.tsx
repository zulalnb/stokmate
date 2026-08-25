import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Alert, Platform, Pressable, useColorScheme } from 'react-native';

import { useLogout } from '@/hooks/use-auth';

const ICON_COLOR = { light: '#60646C', dark: '#B0B4BA' };

export function LogoutButton() {
  const scheme = useColorScheme();
  const { mutate: logout, isPending } = useLogout();
  const iconColor = scheme === 'dark' ? ICON_COLOR.dark : ICON_COLOR.light;

  const handlePress = () => {
    Alert.alert('Çıkış yap', 'Oturumunuz kapatılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (isPending) {
    return <ActivityIndicator size="small" color={iconColor} />;
  }

  return (
    <Pressable onPress={handlePress} hitSlop={8} className="active:opacity-70">
      {Platform.OS === 'ios' ? (
        <SymbolView name="rectangle.portrait.and.arrow.right" size={20} tintColor={iconColor} />
      ) : (
        <Ionicons name="log-out-outline" size={22} color={iconColor} />
      )}
    </Pressable>
  );
}
