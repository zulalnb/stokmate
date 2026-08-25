import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useLogin } from '@/hooks/use-auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleSubmit = () => {
    if (!email || !password) return;
    login.mutate({ email, password });
  };

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 justify-center gap-8 px-6">
        <ThemedText type="title" className="text-center">
          StokMate
        </ThemedText>

        <ThemedView type="backgroundElement" className="gap-4 rounded-3xl p-6">
          <TextInput
            className="h-12 rounded-lg border border-background-selected px-4 text-base text-text placeholder:text-text-secondary dark:border-background-selected-dark dark:text-text-dark"
            placeholder="E-posta"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="h-12 rounded-lg border border-background-selected px-4 text-base text-text placeholder:text-text-secondary dark:border-background-selected-dark dark:text-text-dark"
            placeholder="Şifre"
            autoCapitalize="none"
            autoComplete="password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {login.isError && (
            <ThemedText type="small" className="text-danger">
              {login.error.message}
            </ThemedText>
          )}

          <Pressable
            className="h-12 items-center justify-center rounded-lg bg-accent active:opacity-80 disabled:opacity-60"
            onPress={handleSubmit}
            disabled={login.isPending}>
            {login.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText type="smallBold" className="text-white">
                Giriş Yap
              </ThemedText>
            )}
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
