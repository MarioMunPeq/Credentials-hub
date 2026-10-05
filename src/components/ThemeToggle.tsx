import { useTheme } from '../context/theme-context'
import { useLanguage } from '../context/language-context'
import { MoonIcon, SunIcon } from './icons'

/**
 * Boton de tema: solo icono.
 *
 * El icono refleja el tema activo y el `aria-label` anuncia la accion que se
 * va a ejecutar, que es lo que necesita saber quien usa lector de pantalla.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'
  const label = isDark ? t.header.themeLight : t.header.themeDark

  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}