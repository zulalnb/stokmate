import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/lib/auth-storage'
import type { AuthTokens } from '@/lib/types'

import { apiClient, refreshClient } from './axios-client'
import { ApiError } from './errors'

const AUTH_EXEMPT_PATHS = ['/auth/login', '/auth/refresh']

function isExempt(url?: string): boolean {
  return AUTH_EXEMPT_PATHS.some((path) => url?.includes(path))
}

apiClient.interceptors.request.use((config) => {
  if (!isExempt(config.url)) {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

let refreshPromise: Promise<string> | null = null

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      clearTokens()
      return Promise.reject(new ApiError('Oturum bulunamadı.', 401))
    }

    refreshPromise = refreshClient
      .post<AuthTokens>('/auth/refresh', { refreshToken })
      .then((response) => {
        setTokens(response.data)
        return response.data.accessToken
      })
      .catch((error) => {
        clearTokens()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isExempt(originalRequest.url)
    ) {
      originalRequest._retry = true

      try {
        const newAccessToken = await refreshAccessToken()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      } catch {
        return Promise.reject(new ApiError('Oturum süresi doldu, tekrar giriş yapın.', 401))
      }
    }

    if (!error.response) {
      return Promise.reject(new ApiError('Sunucuya ulaşılamadı.', 0))
    }

    const message =
      typeof error.response.data === 'string' && error.response.data
        ? error.response.data
        : 'Beklenmeyen bir hata oluştu.'

    return Promise.reject(new ApiError(message, error.response.status))
  },
)
