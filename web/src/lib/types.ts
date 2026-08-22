export interface AuthUser {
  id: number
  email: string
  fullName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: AuthUser
}

export interface LoginPayload {
  email: string
  password: string
}
