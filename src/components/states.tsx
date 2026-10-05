import { useLanguage } from '../context/language-context'

interface StatesProps {
  errorMessage: string | null
  isFileProtocolError: boolean
  onRetry: () => void
}

/**
 * Estado de error al cargar el JSON.
 *
 * Se distingue el caso de abrir el sitio desde el disco, que es el error mas
 * habitual y el que mas confunde: la explicacion aparece en la propia pagina.
 */
export function ErrorState({ errorMessage, isFileProtocolError, onRetry }: StatesProps) {
  const { t } = useLanguage()

  const title = isFileProtocolError ? t.states.fileProtocolTitle : t.states.errorTitle
  const detail = isFileProtocolError ? t.states.fileProtocolHint : (errorMessage ?? '')

  return (
    <section className="state container state--error" role="alert">
      <h2 className="state__title">{title}</h2>
      {isFileProtocolError ? (
        <p className="state__text">{detail}</p>
      ) : (
        <>
          <p className="state__text">{t.states.errorHint}</p>
          {detail && <p className="state__meta mono">{detail}</p>}
        </>
      )}

      <p className="state__action">
        <button type="button" className="link" onClick={onRetry}>
          {t.states.retry}
        </button>
      </p>
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
  /** `true` cuando el listado se vacio por una busqueda, no por falta de datos. */
  isFiltered: boolean
  onClear: () => void
}

export function EmptyState({ isFiltered, onClear }: EmptyStateProps) {
  const { t } = useLanguage()

  return (
    <div className="state container">
      <h2 className="state__title">
        {isFiltered ? t.empty.filteredTitle : t.empty.noDataTitle}
      </h2>
      <p className="state__text">{isFiltered ? t.empty.filteredHint : t.empty.noDataHint}</p>

      {isFiltered && (
        <p className="state__action">
          <button type="button" className="link" onClick={onClear}>
            {t.empty.clearSearch}
          </button>
        </p>
      )}
    </div>
  )
}