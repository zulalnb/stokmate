import { authStorage } from '@/lib/auth-storage';
import { type AuthUser, sessionStore } from '@/lib/session-store';

import { ApiError } from './errors';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const PUBLIC_PATHS = ['/auth/login', '/auth/refresh'];

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
};

async function parseErrorMessage(response: Response) {
  const text = await response.text();
  return text || `HTTP ${response.status}`;
}

// Bypasses `request()` on purpose: calling into it here would recurse into the
// 401 handling below. Refresh never needs a Bearer header anyway.
async function rawRefresh(refreshToken: string): Promise<RefreshResponse> {
  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return response.json();
}

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
        const data = await rawRefresh(currentRefreshToken);
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

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const isPublic = PUBLIC_PATHS.includes(path);

  if (!isPublic && !isRetry && isAccessTokenExpiringSoon()) {
    await refreshSession();
  }

  const { accessToken } = sessionStore.getSnapshot();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(!isPublic && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && !isPublic && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, options, true);
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};
