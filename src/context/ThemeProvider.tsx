import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './theme-context'
import { resolveInitialTheme, THEME_STORAGE_KEY, type Theme } from './preferences'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* localStorage no disponible */
    }
  }, [theme])

  const value = useMemo(() => ({ theme, setTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}