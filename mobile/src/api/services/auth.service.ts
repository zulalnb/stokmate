import type { AuthUser } from '@/lib/session-store';

import { apiClient } from '../client';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
};

export const authService = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),
  logout: (refreshToken: string) => apiClient.post<void>('/auth/logout', { refreshToken }),
};
