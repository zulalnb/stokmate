import { useMutation } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';

import { refreshSession } from '@/api/interceptors';
import { authService } from '@/api/services/auth.service';
import { authStorage } from '@/lib/auth-storage';
import { sessionStore } from '@/lib/session-store';

export function useSession() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot);
}

export function useBootstrapSession() {
  useEffect(() => {
    refreshSession();
  }, []);
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: async (data) => {
      await authStorage.setRefreshToken(data.refreshToken);
      sessionStore.setSession(data.accessToken, data.user, data.expiresAt);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = await authStorage.getRefreshToken();
      if (refreshToken) {
        await authService.logout(refreshToken).catch(() => {});
      }
    },
    onSettled: async () => {
      await authStorage.clearRefreshToken();
      sessionStore.clearSession();
    },
  });
}
