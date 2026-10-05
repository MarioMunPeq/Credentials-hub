import { useEffect, useId, useRef } from 'react'
import { useLanguage } from '../context/language-context'
import { CloseIcon, SearchIcon } from './icons'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  /** Numero de resultados, para el anuncio a lector de pantalla. */
  resultLabel: string
}

/**
 * Buscador de solo línea inferior, con el atajo "/" para enfocarlo.
 *
 * El atajo se ignora cuando el foco ya está en un campo de texto o en un
 * elemento editable, para no stealing la escritura a quien ya está escribiendo.
 *
 * Busca en título, entidad y en las etiquetas ocultas del JSON, así que
 * "python" encuentra el bootcamp aunque el título no lo mencione.
 */
export function SearchField({ value, onChange, resultLabel }: SearchFieldProps) {
  const { t } = useLanguage()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== t.search.shortcut || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      const isTyping =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable

      if (isTyping) return

      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [t.search.shortcut])

  return (
    <div className="search">
      <label className="visually-hidden" htmlFor={inputId}>
        {t.search.label}
      </label>

      <SearchIcon className="search__icon" />

      <input
        id={inputId}
        ref={inputRef}
        className="search__input"
        type="search"
        value={value}
        autoComplete="off"
        placeholder={t.search.placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // Escape limpia la consulta sin vaciar el resto de la página.
          if (event.key === 'Escape' && value) {
            event.preventDefault()
            onChange('')
          }
        }}
      />

      {value !== '' ? (
        <button
          type="button"
          className="search__clear"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
          title={t.search.clear}
          aria-label={t.search.clear}
        >
          <CloseIcon />
        </button>
      ) : (
        <kbd className="search__shortcut mono" aria-hidden="true">
          {t.search.shortcut}
        </kbd>
      )}

      {/* Anuncia el número de resultados sin mover el foco ni el scroll. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {value ? resultLabel : ''}
      </span>
    </div>
  )
}
