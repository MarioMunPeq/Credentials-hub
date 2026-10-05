import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ThemeContext } from './theme-context'
import { resolveInitialTheme, THEME_STORAGE_KEY, type Theme } from './preferences'

/**
 * Tema activo.
 *
 * El cambio **no se anima aquí**: se cambia `data-theme` en la raíz y son los
 * tokens, registrados con `@property`, los que interpolan solos. Antes se pintaba
 * un círculo del color de destino encima de la página, lo que producía un flash y
 * luego un cambio de golpe; ahora la página entera vira de color de forma continua
 * porque cada token transiciona su valor.
 *
 * Esto no anima la primera vez que se aplica el tema, ni cuando lo cambia el
 * sistema: eso lo hace el navegador antes de que haya nada que animar, y con
 * `prefers-reduced-motion` las transiciones están desactivadas por CSS.
 */
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

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}