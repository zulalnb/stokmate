import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { authStorage } from '@/lib/auth-storage';
import { type AuthUser, sessionStore } from '@/lib/session-store';

import { apiClient, refreshClient } from './axios-client';
import { ApiError } from './errors';

const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh'];

function isExempt(url?: string): boolean {
  return AUTH_EXEMPT_PATHS.some((path) => url?.includes(path));
}

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
};

let refreshPromise: Promise<boolean> | null = null;

export async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const currentRefreshToken = await authStorage.getRefreshToken();
      if (!currentRefreshToken) {
        sessionStore.clearSession();
        return false;
      }

      try {
        const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', {
          refreshToken: currentRefreshToken,
        });
        await authStorage.setRefreshToken(data.refreshToken);
        sessionStore.setSession(data.accessToken, data.user, data.expiresAt);
        return true;
      } catch {
        await authStorage.clearRefreshToken();
        sessionStore.clearSession();
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

const EXPIRY_BUFFER_MS = 10_000;

function isAccessTokenExpiringSoon(): boolean {
  const { accessToken, expiresAt } = sessionStore.getSnapshot();
  if (!accessToken) return false;
  if (!expiresAt) return true;
  return Date.parse(expiresAt) - Date.now() < EXPIRY_BUFFER_MS;
}

apiClient.interceptors.request.use(async (config) => {
  if (!isExempt(config.url)) {
    if (isAccessTokenExpiringSoon()) {
      await refreshSession();
    }

    const { accessToken } = sessionStore.getSnapshot();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return config;
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isExempt(originalRequest.url)
    ) {
      originalRequest._retry = true;

      const refreshed = await refreshSession();
      if (refreshed) {
        const { accessToken } = sessionStore.getSnapshot();
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      }

      return Promise.reject(new ApiError('Oturum süresi doldu, tekrar giriş yapın.', 401));
    }

    if (!error.response) {
      return Promise.reject(new ApiError('Sunucuya ulaşılamadı.', 0));
    }

    const message =
      typeof error.response.data === 'string' && error.response.data
        ? error.response.data
        : `HTTP ${error.response.status}`;

    return Promise.reject(new ApiError(message, error.response.status));
  },
);
