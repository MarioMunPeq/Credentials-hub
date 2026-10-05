import { useTheme } from '../context/theme-context'
import { useLanguage } from '../context/language-context'
import { MoonIcon, SunIcon } from './icons'

/**
 * Interruptor de tema claro/oscuro.
 *
 * El icono se elige segun el tema activo, pero el `aria-label` anuncia la
 * accion que se va a ejecutar ("Cambiar a modo oscuro"), que es lo que necesita
 * saber quien usa lector de pantalla.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggleTheme}
      aria-label={isDark ? t.header.themeLight : t.header.themeDark}
      title={isDark ? t.header.themeLight : t.header.themeDark}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}