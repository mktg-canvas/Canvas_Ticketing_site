import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply theme class before first paint to avoid flash.
// Default: light. Dark only if user explicitly toggled.
localStorage.removeItem('theme') // migrate away from legacy key
const stored = localStorage.getItem('theme_v2')
if (stored !== 'dark') document.documentElement.classList.add('light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
