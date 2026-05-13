import { StrictMode, Component, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info) }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444', marginBottom: 12 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#111', fontSize: 13 }}>
            {err.message}
            {import.meta.env.DEV && `\n\n${err.stack}`}
          </pre>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            style={{ marginTop: 20, padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Clear session &amp; go to login
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Apply theme class before first paint to avoid flash.
// Default: light. Dark only if user explicitly toggled.
localStorage.removeItem('theme') // migrate away from legacy key
const stored = localStorage.getItem('theme_v2')
if (stored !== 'dark') document.documentElement.classList.add('light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
