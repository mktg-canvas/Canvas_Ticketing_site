import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
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
      const routes: Record<Role, string> = { fm: '/fm/dashboard', super_admin: '/superadmin/dashboard' }
      navigate(routes[user.role as Role])
    } catch (err: unknown) {
      setError(isAxiosError(err) ? err.response?.data?.error || 'Login failed.' : 'Login failed.')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg0)' }}>
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{
          background: 'linear-gradient(145deg, #3b1f6e 0%, #552e9e 60%, #7b4fd4 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Canvas" className="h-12 w-auto object-contain brightness-0 invert" />
        </div>

        <div>
          <p className="text-4xl font-bold leading-tight mb-4" style={{ color: '#fff' }}>
            Facility Management,<br />simplified.
          </p>
          <p className="text-base opacity-70" style={{ color: '#fff' }}>
            Raise, track and resolve workspace issues — all in one place.
          </p>
        </div>

        <p className="text-xs opacity-40" style={{ color: '#fff' }}>
          © {new Date().getFullYear()} Canvas Workspace. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <img src="/logo.png" alt="Canvas" className="h-16 w-auto object-contain mx-auto" />
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-txt1)' }}>Welcome</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-txt3)' }}>Sign in to your workspace</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Email</label>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="you@canvas.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 outline-none border transition-colors"
                style={{
                  background: 'var(--color-bg1)',
                  borderColor: 'var(--color-bg4)',
                  color: 'var(--color-txt1)',
                  height: 52,
                  fontSize: 15,
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-txt3)' }}>Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: true })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 pr-12 outline-none border transition-colors"
                  style={{
                    background: 'var(--color-bg1)',
                    borderColor: 'var(--color-bg4)',
                    color: 'var(--color-txt1)',
                    height: 52,
                    fontSize: 15,
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--color-bg4)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-txt3)' }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--bg-danger-10)', color: 'var(--color-danger)' }}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-danger)' }} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ background: 'var(--color-accent)', color: '#fff', height: 52 }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--color-txt3)' }}>
            New user?{' '}
            <span style={{ color: 'var(--color-txt2)' }}>Contact your administrator to get access.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
