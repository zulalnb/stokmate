import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemedView } from '@/components/themed-view';
import { useBootstrapSession, useSession } from '@/hooks/use-auth';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useSession();

  useBootstrapSession();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        {isLoading ? (
          <ThemedView className="flex-1" />
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={isAuthenticated}>
              <Stack.Screen name="index" />
            </Stack.Protected>
            <Stack.Protected guard={!isAuthenticated}>
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
