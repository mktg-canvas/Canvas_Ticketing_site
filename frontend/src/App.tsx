import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import Login from './pages/auth/Login'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { useAuthStore } from './store/authStore'

const FmDashboard           = lazy(() => import('./pages/fm/Dashboard'))
const RaiseTicket           = lazy(() => import('./pages/fm/RaiseTicket'))
const AllTickets            = lazy(() => import('./pages/fm/AllTickets'))
const FmTicketDetail        = lazy(() => import('./pages/fm/TicketDetail'))
const SuperAdminDashboard   = lazy(() => import('./pages/superadmin/Dashboard'))
const SuperAdminAllTickets  = lazy(() => import('./pages/superadmin/AllTickets'))
const Accounts              = lazy(() => import('./pages/superadmin/Accounts'))
const Analytics             = lazy(() => import('./pages/superadmin/Analytics'))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore(s => s.setAuth)

  useEffect(() => {
    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        if (data.accessToken && data.user) setAuth(data.user, data.accessToken)
      })
      .catch(() => {})
  }, [setAuth])

  return <>{children}</>
}

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg0)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/fm/*" element={
                <ProtectedRoute allowedRoles={['fm']}>
                  <Routes>
                    <Route path="dashboard" element={<FmDashboard />} />
                    <Route path="raise-ticket" element={<RaiseTicket />} />
                    <Route path="tickets" element={<AllTickets />} />
                    <Route path="tickets/:id" element={<FmTicketDetail />} />
                  </Routes>
                </ProtectedRoute>
              } />

              <Route path="/superadmin/*" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <Routes>
                    <Route path="dashboard" element={<SuperAdminDashboard />} />
                    <Route path="tickets" element={<SuperAdminAllTickets />} />
                    <Route path="tickets/:id" element={<FmTicketDetail />} />
                    <Route path="accounts" element={<Accounts />} />
                    <Route path="analytics" element={<Analytics />} />
                  </Routes>
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
