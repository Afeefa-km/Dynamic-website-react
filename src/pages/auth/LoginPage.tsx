import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { authApi } from '../../lib/services'
import { AuthLayout } from './AuthLayout'

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/dashboard'
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      signIn(res)
      navigate(from, { replace: true })
    },
  })

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your store.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        <Field label="Email" required error={errors.email?.message}>
          <Input {...register('email')} type="email" autoComplete="email" aria-invalid={!!errors.email} />
        </Field>
        <Field label="Password" required error={errors.password?.message}>
          <Input {...register('password')} type="password" autoComplete="current-password" aria-invalid={!!errors.password} />
        </Field>
        <Button type="submit" loading={mutation.isPending} className="w-full">
          Sign in
        </Button>
        <p className="text-center text-sm text-gray-500">
          New to Storely?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
