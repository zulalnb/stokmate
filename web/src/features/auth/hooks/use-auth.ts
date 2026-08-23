import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { authService } from '@/api/services/auth.service'
import { clearTokens, getRefreshToken } from '@/lib/auth-storage'

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => {
      const refreshToken = getRefreshToken()
      return refreshToken ? authService.logout(refreshToken) : Promise.resolve()
    },
    onSettled: () => {
      clearTokens()
      queryClient.clear()
      navigate({ to: '/login' })
    },
  })
}

export const meQuery = () =>
  queryOptions({ queryKey: ['auth', 'me'], queryFn: authService.me, retry: false })
