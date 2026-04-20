import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Ticket } from 'lucide-react'
import { isAxiosError } from 'axios'
import api from '../../lib/axios'

interface RegisterForm {
  name: string
  email: string
  password: string
}

export default function Register() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<RegisterForm>()

  async function onSubmit(data: RegisterForm) {
    setError('')
    try {
      await api.post('/auth/register', data)
      navigate('/login', { state: { registered: true } })
    } catch (err: unknown) {
      setError(isAxiosError(err) ? err.response?.data?.error || 'Registration failed.' : 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-bg0)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
            <Ticket size={20} color="white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: 'var(--color-txt1)' }}>Canvas Workspace</span>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: 'var(--color-bg1)', borderColor: 'var(--color-bg4)' }}>
          <h1 className="text-base font-semibold mb-1" style={{ color: 'var(--color-txt1)' }}>Create account</h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-txt2)' }}>Register as a client</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {[
              { field: 'name' as const, label: 'Full name', type: 'text', placeholder: 'Aryan Sharma' },
              { field: 'email' as const, label: 'Email', type: 'email', placeholder: 'you@company.com' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>{label}</label>
                <input
                  {...register(field, { required: `${label} is required` })}
                  type={type}
                  placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-base outline-none border transition-colors"
                  style={{ background: 'var(--color-bg3)', borderColor: errors[field] ? 'var(--color-danger)' : 'var(--color-bg4)', color: 'var(--color-txt1)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = errors[field] ? 'var(--color-danger)' : 'var(--color-bg4)')}
                />
                {errors[field] && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors[field]?.message}</p>}
              </div>
            ))}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-txt2)' }}>Password</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars with uppercase & number"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-base outline-none border transition-colors"
                  style={{ background: 'var(--color-bg3)', borderColor: errors.password ? 'var(--color-danger)' : 'var(--color-bg4)', color: 'var(--color-txt1)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
                  onBlur={(e) => (e.target.style.borderColor = errors.password ? 'var(--color-danger)' : 'var(--color-bg4)')}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-txt3)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.password.message}</p>}
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
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-txt2)' }}>
          Already have an account?{' '}
          <Link to="/login" className="hover:underline" style={{ color: 'var(--color-accent)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
