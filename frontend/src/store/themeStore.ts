import { create } from 'zustand'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
}

const STORAGE_KEY = 'theme_v2'

// One-time migration: clear legacy key so existing dark-mode users reset to light default
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('theme')
}

export const useThemeStore = create<ThemeState>((set) => {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  // Default: light mode. Only dark if user has explicitly toggled.
  const initialDark = stored === 'dark'

  if (typeof document !== 'undefined') {
    if (initialDark) document.documentElement.classList.remove('light')
    else             document.documentElement.classList.add('light')
  }

  return {
    isDarkMode: initialDark,
    toggleTheme: () => set((state) => {
      const nextIsDark = !state.isDarkMode
      if (nextIsDark) {
        document.documentElement.classList.remove('light')
        localStorage.setItem(STORAGE_KEY, 'dark')
      } else {
        document.documentElement.classList.add('light')
        localStorage.setItem(STORAGE_KEY, 'light')
      }
      return { isDarkMode: nextIsDark }
    }),
  }
})
