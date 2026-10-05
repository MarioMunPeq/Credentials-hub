import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LanguageContext } from './language-context'
import { resolveInitialLanguage, LANGUAGE_STORAGE_KEY } from './preferences'
import { translations, type Language } from '../i18n/translations'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(resolveInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      /* localStorage no disponible */
    }
  }, [language])

  const toggleLanguage = useCallback(() => {
    setLanguage((current) => (current === 'es' ? 'en' : 'es'))
  }, [])

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t: translations[language] }),
    [language, toggleLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}