import type { AuthTokens, AuthUser, LoginPayload } from '@/lib/types'

import { apiClient } from '../axios-client'

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthTokens>('/auth/login', payload).then((res) => res.data),
  me: () => apiClient.get<AuthUser>('/auth/me').then((res) => res.data),
}
