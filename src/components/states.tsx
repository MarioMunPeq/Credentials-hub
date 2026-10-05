import { useLanguage } from '../context/language-context'

interface ErrorStateProps {
  message: string | null
  isFileProtocolError: boolean
  onRetry: () => void
}

/**
 * Estado de error al cargar el JSON.
 *
 * Se distingue el caso de abrir el sitio desde el disco, que es el error mas
 * habitual y el que mas confunde: la explicacion aparece en el propio sitio.
 */
export function ErrorState({ message, isFileProtocolError, onRetry }: ErrorStateProps) {
  const { t } = useLanguage()

  return (
    <section className="state state--error container" role="alert">
      <h2 className="state__title">
        {isFileProtocolError ? t.states.fileProtocolTitle : t.states.errorTitle}
      </h2>
      <p className="state__text">
        {isFileProtocolError ? t.states.fileProtocolHint : (message ?? t.states.errorHint)}
      </p>
      <button type="button" className="button button--primary" onClick={onRetry}>
        {t.states.retry}
      </button>
    </section>
  )
}

export function LoadingState() {
  const { t } = useLanguage()

  return (
    <div className="state container" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p className="state__text">{t.states.loading}</p>
    </div>
  )
}

interface EmptyStateProps {
  /** `true` cuando el listado esta vacio por filtros, no por falta de datos. */
  isFiltered: boolean
  onClear: () => void
}

export function EmptyState({ isFiltered, onClear }: EmptyStateProps) {
  const { t } = useLanguage()

  return (
    <div className="state container">
      <h2 className="state__title">{isFiltered ? t.empty.title : t.empty.noDataTitle}</h2>
      <p className="state__text">{isFiltered ? t.empty.hint : t.empty.noDataHint}</p>
      {isFiltered && (
        <button type="button" className="button button--primary" onClick={onClear}>
          {t.empty.clearAll}
        </button>
      )}
    </div>
  )
}