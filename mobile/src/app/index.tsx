import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLogout, useSession } from '@/hooks/use-auth';

export default function ProtectedScreen() {
  const { user } = useSession();
  const logout = useLogout();

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 items-center justify-center gap-6 px-6">
        <ThemedText type="title" className="text-center">
          Giriş yapıldı
        </ThemedText>
        {user && <ThemedText type="default">{user.fullName}</ThemedText>}

        <Pressable
          className="h-12 items-center justify-center rounded-lg bg-accent px-6 active:opacity-80 disabled:opacity-60"
          onPress={() => logout.mutate()}
          disabled={logout.isPending}>
          <ThemedText type="smallBold" className="text-white">
            {logout.isPending ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}
