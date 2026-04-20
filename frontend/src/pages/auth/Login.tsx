import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Ticket } from 'lucide-react'
import { isAxiosError } from 'axios'
import api from '../../lib/axios'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()

  async function onSubmit(data: LoginForm) {
    setError('')
    try {
      const res = await api.post('/auth/login', data)
      const { accessToken, user } = res.data
      setAuth(user, accessToken)

      const routes: Record<Role, string> = {
        client: '/client/dashboard',
        admin: '/admin/dashboard',
        super_admin: '/superadmin/dashboard',
      }
      navigate(routes[user.role as Role])
    } catch (err: unknown) {
      setError(isAxiosError(err) ? err.response?.data?.error || 'Login failed. Please try again.' : 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg0)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Ticket size={20} color="white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--color-txt1)' }}>Canvas Workspace</span>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6 border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <h1 className="text-base font-semibold mb-1" style={{ color: 'var(--color-txt1)' }}>Sign in</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-txt2)' }}>Access your support portal</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Email</label>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="w-full rounded-lg px-3 py-2.5 text-base outline-none border transition-colors"
                style={{
                  background: 'var(--color-bg3)',
                  borderColor: 'var(--color-bg4)',
                  color: 'var(--color-txt1)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg4)')}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Password</label>
                <Link to="/forgot-password" className="text-xs hover:underline" style={{ color: 'var(--color-accent)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password', { required: true })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-base outline-none border transition-colors"
                  style={{
                    background: 'var(--color-bg3)',
                    borderColor: 'var(--color-bg4)',
                    color: 'var(--color-txt1)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-bg4)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-txt3)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#fff', minHeight: '44px' }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-txt2)' }}>
          New here?{' '}
          <Link to="/register" className="hover:underline" style={{ color: 'var(--color-accent)' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
