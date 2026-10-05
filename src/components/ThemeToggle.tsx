import { useRef } from 'react'
import { useTheme } from '../context/theme-context'
import { useLanguage } from '../context/language-context'
import { MoonIcon, SunIcon } from './icons'
import { useThemeReveal } from './useThemeReveal'

/**
 * Boton de tema: solo icono.
 *
 * El icono refleja el tema activo y el `aria-label` anuncia la accion que se
 * va a ejecutar, que es lo que necesita saber quien usa lector de pantalla.
 *
 * El cambio no se aplica al instante: el círculo de apertura sale del propio
 * botón, así que hace falta su posición en el DOM.
 */
export function ThemeToggle() {
  const { theme } = useTheme()
  const { t } = useLanguage()
  const reveal = useThemeReveal()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const isDark = theme === 'dark'
  const label = isDark ? t.header.themeLight : t.header.themeDark

  return (
    <button
      ref={buttonRef}
      type="button"
      className="icon-button"
      onClick={() => {
        if (buttonRef.current) reveal(buttonRef.current)
      }}
      aria-label={label}
      title={label}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}