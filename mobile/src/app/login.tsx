import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

        <ThemedView
          type="backgroundElement"
          className="gap-4 rounded-3xl p-6"
          style={{ borderCurve: 'continuous' }}>
          <Input
            placeholder="E-posta"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
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

          <Button title="Giriş Yap" onPress={handleSubmit} loading={login.isPending} />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}
