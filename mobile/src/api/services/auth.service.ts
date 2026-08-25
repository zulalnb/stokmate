import type { AuthUser } from '@/lib/session-store';

import { apiClient } from '../axios-client';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
};

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }).then((res) => res.data),
  logout: (refreshToken: string) =>
    apiClient.post<void>('/auth/logout', { refreshToken }).then(() => undefined),
};
