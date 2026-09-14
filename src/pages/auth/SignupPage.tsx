import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { authApi } from '../../lib/services'
import { emailField, PASSWORD_REGEX, phoneField } from '../../lib/validation'
import { AuthLayout } from './AuthLayout'

const schema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(150),
    email: emailField(),
    phoneNumber: phoneField(),
    password: z.string().regex(PASSWORD_REGEX, 'At least 6 characters with a letter and a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

type FormValues = z.infer<typeof schema>

export default function SignupPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      signIn(res)
      // The dashboard opens the Create Store popup for owners without a store
      navigate('/dashboard', { replace: true })
    },
  })

  return (
    <AuthLayout title="Create your account" subtitle="Start selling online in a few simple steps.">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
        <Field label="Full name" required error={errors.fullName?.message}>
          <Input {...register('fullName')} autoComplete="name" placeholder="Jane Doe" aria-invalid={!!errors.fullName} />
        </Field>
        <Field label="Email" required error={errors.email?.message}>
          <Input {...register('email')} type="email" autoComplete="email" placeholder="jane@example.com" aria-invalid={!!errors.email} />
        </Field>
        <Field label="Phone number" required error={errors.phoneNumber?.message}>
          <Input {...register('phoneNumber')} type="tel" autoComplete="tel" placeholder="+971501234567" aria-invalid={!!errors.phoneNumber} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" required error={errors.password?.message}>
            <Input {...register('password')} type="password" autoComplete="new-password" aria-invalid={!!errors.password} />
          </Field>
          <Field label="Confirm password" required error={errors.confirmPassword?.message}>
            <Input {...register('confirmPassword')} type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
          </Field>
        </div>
        <Button type="submit" loading={mutation.isPending} className="w-full">
          Create account
        </Button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
