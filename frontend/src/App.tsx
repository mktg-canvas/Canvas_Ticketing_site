import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axios from 'axios'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ClientDashboard from './pages/client/Dashboard'
import RaiseTicket from './pages/client/RaiseTicket'
import MyTickets from './pages/client/MyTickets'
import ClientTicketDetail from './pages/client/TicketDetail'
import AdminDashboard from './pages/admin/Dashboard'
import AllTickets from './pages/admin/AllTickets'
import AdminTicketDetail from './pages/admin/TicketDetail'
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import SuperAdminAllTickets from './pages/superadmin/AllTickets'
import AdminTicketDetailSA from './pages/admin/TicketDetail'
import Accounts from './pages/superadmin/Accounts'
import ProtectedRoute from './components/shared/ProtectedRoute'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth } = useAuthStore()

  useEffect(() => {
    // Proactively get a fresh access token on mount using the httpOnly refresh cookie.
    // This prevents the first protected API call from hitting a 401.
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
          <Route path="/register" element={<Register />} />

          <Route path="/client/*" element={
            <ProtectedRoute allowedRoles={['client']}>
              <Routes>
                <Route path="dashboard" element={<ClientDashboard />} />
                <Route path="raise-ticket" element={<RaiseTicket />} />
                <Route path="tickets" element={<MyTickets />} />
                <Route path="tickets/:id" element={<ClientTicketDetail />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="tickets" element={<AllTickets />} />
                <Route path="tickets/:id" element={<AdminTicketDetail />} />
              </Routes>
            </ProtectedRoute>
          } />

          <Route path="/superadmin/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <Routes>
                <Route path="dashboard" element={<SuperAdminDashboard />} />
                <Route path="tickets" element={<SuperAdminAllTickets />} />
                <Route path="tickets/:id" element={<AdminTicketDetailSA />} />
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
