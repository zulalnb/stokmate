import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { ApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useLogin } from '@/features/auth/hooks/use-auth'
import { hasSession, setTokens } from '@/lib/auth-storage'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (hasSession()) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

const loginSchema = z.object({
  email: z.string().min(1, 'E-posta gerekli.'),
  password: z.string().min(1, 'Şifre gerekli.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        setTokens(data)
        navigate({ to: '/dashboard' })
      },
    })
  }

  const apiErrorMessage =
    loginMutation.error instanceof ApiError ? loginMutation.error.message : undefined

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Giriş yap</CardTitle>
          <CardDescription>Devam etmek için hesap bilgilerinizi girin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-posta</FieldLabel>
                <FieldContent>
                  <Input id="email" type="email" autoComplete="email" {...register('email')} />
                  <FieldError errors={[errors.email]} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Şifre</FieldLabel>
                <FieldContent>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <FieldError errors={[errors.password]} />
                </FieldContent>
              </Field>
              {apiErrorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {apiErrorMessage}
                </p>
              )}
              <Button type="submit" disabled={loginMutation.isPending} className="w-full">
                {loginMutation.isPending ? 'Giriş yapılıyor…' : 'Giriş yap'}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
