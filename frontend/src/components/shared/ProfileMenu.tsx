import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/axios'

export default function ProfileMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    await api.post('/auth/logout').catch(() => {})
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full text-sm font-semibold transition-opacity hover:opacity-80"
        style={{
          width: 36,
          height: 36,
          background: '#4f8ef7',
          color: '#fff',
          flexShrink: 0,
        }}
        aria-label="Profile menu"
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 rounded-xl border shadow-lg z-50"
          style={{
            background: '#1f2330',
            borderColor: '#2e3545',
            minWidth: 200,
            top: '100%',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: '#2e3545' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
                style={{ width: 36, height: 36, background: '#4f8ef7', color: '#fff' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#e8eaf0' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: '#8b92a5' }}>{user?.email}</p>
                <p
                  className="text-xs capitalize mt-0.5"
                  style={{ color: '#4f8ef7' }}
                >
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
              style={{ color: '#f05252' }}
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
