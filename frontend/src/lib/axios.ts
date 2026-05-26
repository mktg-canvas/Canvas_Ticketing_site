import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
interface QueueEntry {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}
let queue: QueueEntry[] = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as RetryConfig
    // Never apply the refresh-and-retry logic to auth endpoints — doing so on a
    // failed login (401 wrong password) would trigger a refresh attempt, fail,
    // redirect to /login, and swallow the real error message.
    const isAuthRoute = original?.url?.includes('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token: string) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(api(original))
            },
            reject: (err) => reject(err),
          })
        })
      }
      refreshing = true
      try {
        const storedRefreshToken = useAuthStore.getState().refreshToken
        const { data } = await axios.post('/api/auth/refresh', storedRefreshToken ? { refreshToken: storedRefreshToken } : {}, { withCredentials: true })
        useAuthStore.getState().setAccessToken(data.accessToken)
        queue.forEach((e) => e.resolve(data.accessToken))
        queue = []
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (refreshErr) {
        queue.forEach((e) => e.reject(refreshErr))
        queue = []
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
