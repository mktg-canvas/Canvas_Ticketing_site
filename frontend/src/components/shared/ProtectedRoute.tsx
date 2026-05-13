import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

interface Props {
  children: React.ReactNode
  allowedRoles?: Role[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const user   = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role in localStorage is stale (e.g. old 'fm' session) — clear it and re-login
    logout()
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
