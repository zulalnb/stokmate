import { queryOptions, useMutation } from '@tanstack/react-query'

import { authService } from '@/api/services/auth.service'

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,
  })
}

export const meQuery = () =>
  queryOptions({ queryKey: ['auth', 'me'], queryFn: authService.me, retry: false })
