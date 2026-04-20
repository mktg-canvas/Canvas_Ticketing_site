import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Sun, Moon } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import api from '../../lib/axios'

export default function ProfileMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { isDarkMode, toggleTheme } = useThemeStore()
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
          background: 'var(--color-accent)',
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
            background: 'var(--color-bg2)',
            borderColor: 'var(--color-bg4)',
            minWidth: 200,
            top: '100%',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-bg4)' }}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full text-sm font-semibold shrink-0"
                style={{ width: 36, height: 36, background: 'var(--color-accent)', color: '#fff' }}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-txt1)' }}>{user?.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-txt2)' }}>{user?.email}</p>
                <p
                  className="text-xs capitalize mt-0.5"
                  style={{ color: 'var(--color-accent)' }}
                >
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={() => { toggleTheme(); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--color-txt1)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-overlay-60)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--color-danger)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-danger-10)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
