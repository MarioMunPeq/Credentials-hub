import { useId, useRef } from 'react'
import { useLanguage } from '../context/language-context'
import { CloseIcon, SearchIcon } from './icons'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  resultLabel: string
}

/** Campo de busqueda con boton para limpiar. */
export function SearchBar({ value, onChange, resultLabel }: SearchBarProps) {
  const { t } = useLanguage()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="search">
      <label className="visually-hidden" htmlFor={inputId}>
        {t.toolbar.searchLabel}
      </label>
      <div className="search__field">
        <span className="search__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          id={inputId}
          ref={inputRef}
          className="search__input"
          type="search"
          value={value}
          autoComplete="off"
          placeholder={t.toolbar.searchPlaceholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && value) {
              event.preventDefault()
              onChange('')
            }
          }}
        />
        {value !== '' && (
          <button
            type="button"
            className="search__clear"
            onClick={() => {
              onChange('')
              inputRef.current?.focus()
            }}
            title={t.toolbar.clearSearch}
            aria-label={t.toolbar.clearSearch}
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Anuncia cuantos resultados tiene la busqueda sin mover el foco. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {value ? resultLabel : ''}
      </span>
    </div>
  )
}