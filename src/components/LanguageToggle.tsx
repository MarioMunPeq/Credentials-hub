import { useLanguage } from '../context/language-context'
import { LANGUAGES } from '../i18n/translations'

/**
 * Selector de idioma como dos textos, con subrayado en el activo.
 *
 * No es un segmented control con caja: el estado se marca con el subrayado y
 * con el color del texto, que es justo lo que el usuario busca.
 */
export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="lang" role="group" aria-label={t.header.language}>
      {LANGUAGES.map(({ code, short, label }) => (
        <button
          key={code}
          type="button"
          className="lang__option"
          lang={code}
          aria-pressed={language === code}
          title={label}
          onClick={() => setLanguage(code)}
        >
          {short}
        </button>
      ))}
    </div>
  )
}