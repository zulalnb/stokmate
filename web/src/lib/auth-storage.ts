const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

function readInitialToken(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

let accessTokenCache: string | null = readInitialToken(ACCESS_TOKEN_KEY)
let refreshTokenCache: string | null = readInitialToken(REFRESH_TOKEN_KEY)

export function getAccessToken(): string | null {
  return accessTokenCache
}

export function getRefreshToken(): string | null {
  return refreshTokenCache
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }): void {
  accessTokenCache = tokens.accessToken
  refreshTokenCache = tokens.refreshToken
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  accessTokenCache = null
  refreshTokenCache = null
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function hasSession(): boolean {
  return !!getAccessToken()
}
