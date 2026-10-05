export const THEME_STORAGE_KEY = 'credentials-hub:theme'
export const LANGUAGE_STORAGE_KEY = 'credentials-hub:language'

export type Theme = 'light' | 'dark'

/**
 * Tema inicial.
 *
 * Orden de prioridad: eleccion guardada, preferencia del sistema y, si no hay
 * ninguna, modo oscuro (el diseño parte de esa paleta). Un sistema que pida
 * luz recibe luz igualmente.
 */
export function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === '"light"' || stored === '"dark"') return stored.slice(1, 7) as Theme
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* localStorage no disponible */
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Idioma guardado en `localStorage`, o el que declara el navegador. */
export function resolveInitialLanguage(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es'

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (stored === '"es"' || stored === '"en"') return stored.slice(1, 3) as 'es' | 'en'
    if (stored === 'es' || stored === 'en') return stored
  } catch {
    /* localStorage no disponible */
  }

  return window.navigator?.language?.toLowerCase().startsWith('en') ? 'en' : 'es'
}