import { create } from 'zustand'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => {
  // Check local storage or default to true for dark mode
  const storedTheme = localStorage.getItem('theme')
  const initialDark = storedTheme === 'light' ? false : true

  // Apply initial theme
  if (!initialDark) {
    document.documentElement.classList.add('light')
  }

  return {
    isDarkMode: initialDark,
    toggleTheme: () => set((state) => {
      const nextIsDark = !state.isDarkMode
      
      if (nextIsDark) {
        document.documentElement.classList.remove('light')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.add('light')
        localStorage.setItem('theme', 'light')
      }
      
      return { isDarkMode: nextIsDark }
    }),
  }
})
