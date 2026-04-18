import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Ticket } from 'lucide-react'
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0f1117' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#4f8ef7' }}>
            <Ticket size={20} color="white" />
          </div>
          <span className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>Canvas Workspace</span>
        </div>

        <div className="rounded-xl p-6 border" style={{ background: '#181c24', borderColor: '#2e3545' }}>
          <h1 className="text-base font-semibold mb-1" style={{ color: '#e8eaf0' }}>Create account</h1>
          <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>Register as a client</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {[
              { field: 'name' as const, label: 'Full name', type: 'text', placeholder: 'Aryan Sharma' },
              { field: 'email' as const, label: 'Email', type: 'email', placeholder: 'you@company.com' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field} className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>{label}</label>
                <input
                  {...register(field, { required: `${label} is required` })}
                  type={type}
                  placeholder={placeholder}
                  className="w-full rounded-lg px-3 py-2.5 text-base outline-none border transition-colors"
                  style={{ background: '#262c3a', borderColor: errors[field] ? '#f05252' : '#2e3545', color: '#e8eaf0' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4f8ef7')}
                  onBlur={(e) => (e.target.style.borderColor = errors[field] ? '#f05252' : '#2e3545')}
                />
                {errors[field] && <p className="text-xs" style={{ color: '#f05252' }}>{errors[field]?.message}</p>}
              </div>
            ))}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#8b92a5' }}>Password</label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 chars with uppercase & number"
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-base outline-none border transition-colors"
                  style={{ background: '#262c3a', borderColor: errors.password ? '#f05252' : '#2e3545', color: '#e8eaf0' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4f8ef7')}
                  onBlur={(e) => (e.target.style.borderColor = errors.password ? '#f05252' : '#2e3545')}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#565e72' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs" style={{ color: '#f05252' }}>{errors.password.message}</p>}
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(240,82,82,0.1)', color: '#f05252' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: '#4f8ef7', color: '#fff', minHeight: '44px' }}
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#8b92a5' }}>
          Already have an account?{' '}
          <Link to="/login" className="hover:underline" style={{ color: '#4f8ef7' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
