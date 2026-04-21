import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import Login from './pages/auth/Login'
import FmDashboard from './pages/fm/Dashboard'
import RaiseTicket from './pages/fm/RaiseTicket'
import AllTickets from './pages/fm/AllTickets'
import FmTicketDetail from './pages/fm/TicketDetail'
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import SuperAdminAllTickets from './pages/superadmin/AllTickets'
import Accounts from './pages/superadmin/Accounts'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth } = useAuthStore()

  useEffect(() => {
    axios.post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        if (data.accessToken && data.user) setAuth(data.user, data.accessToken)
      })
      .catch(() => {})
  }, [])

  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
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
                </Routes>
              </ProtectedRoute>
            } />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
