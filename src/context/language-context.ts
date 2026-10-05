import { createContext, useContext } from 'react'
import type { Language } from '../i18n/translations'
import { translations, type TranslationShape } from '../i18n/translations'

export interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  /** Atajo de traduccion: `t('card.download')`. */
  t: TranslationShape
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)

/**
 * Acceso al idioma activo.
 *
 * Lanza un error explicito si se usa fuera del provider: es un fallo de
 * programacion, no algo que deba degradarse en silencio.
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de <LanguageProvider>')
  }
  return context
}

export { translations }