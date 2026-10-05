import { useLanguage } from '../context/language-context'
import { LANGUAGES } from '../i18n/translations'

/**
 * Selector de idioma con dos botones.
 *
 * Se implementa como grupo de botones con `aria-pressed` en lugar de un
 * `<select>` para que el estado activo sea visible y accesible sin abrir un
 * desplegable del sistema.
 */
export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="lang-toggle" role="group" aria-label={t.header.toggleLanguage}>
      {LANGUAGES.map(({ code, short, label }) => (
        <button
          key={code}
          type="button"
          className="lang-toggle__button"
          aria-pressed={language === code}
          lang={code}
          title={label}
          onClick={() => setLanguage(code)}
        >
          {short}
        </button>
      ))}
    </div>
  )
}