import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Trajectory } from './components/Trajectory'
import { CertificateSectionBlock } from './components/CertificateSection'
import { PdfModal } from './components/PdfModal'
import { ErrorState, EmptyState, LoadingState } from './components/states'
import { useCertificates } from './hooks/useCertificates'
import { useLanguage } from './context/language-context'
import { site } from './config/site'
import {
  buildSections,
  searchCertificates,
} from './utils/certificates'
import type { ProcessedCertificate } from './types/certificate'

/** Cuánto dura el resaltado de la entrada destino de la trayectoria. */
const HIGHLIGHT_MS = 1600

export function App() {
  const { language, t } = useLanguage()
  const { status, certificates, error, isFileProtocolError, retry } = useCertificates()

  const [query, setQuery] = useState('')
  const [preview, setPreview] = useState<ProcessedCertificate | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Elemento que abrió el modal, para devolverle el foco al cerrarlo.
  const previewTriggerRef = useRef<HTMLElement | null>(null)

  const closePreview = useCallback(() => {
    setPreview(null)
    previewTriggerRef.current?.focus()
  }, [])

  const openPreview = useCallback((certificate: ProcessedCertificate) => {
    previewTriggerRef.current = document.activeElement as HTMLElement | null
    setPreview(certificate)
  }, [])

  // Título y descripción del documento siguen al idioma activo.
  useEffect(() => {
    document.title = `${site.name} — ${t.meta.title}`
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t.meta.description)
  }, [t])

  const visible = useMemo(
    () => searchCertificates(certificates, query),
    [certificates, query],
  )

  const sections = useMemo(
    () => buildSections(visible, language),
    [visible, language],
  )

  /** Secciones sin filtrar: permiten atenuar los ítems de navegación vacíos. */
  const allSectionIds = useMemo(
    () => buildSections(certificates, language).map((section) => section.id),
    [certificates, language],
  )

  const visibleIds = useMemo(
    () => new Set(visible.map((certificate) => certificate.id)),
    [visible],
  )

  const hasData = status === 'ready' && certificates.length > 0

  /** Salta a una sección compensando el borde fijo del área de contenido. */
  const jumpTo = useCallback((id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /*
    Clic en un nodo de la trayectoria: lleva a la entrada y la resalta.
    Si la entrada no existe porque la búsqueda la ocultó, se limpia la búsqueda
    y se espera al siguiente render, cuando ya está en el DOM.
  */
  const focusEntry = useCallback(
    (certificate: ProcessedCertificate) => {
      const scrollTo = () => {
        const target = document.getElementById(`entry-${certificate.id}`)
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })

        if (highlightTimer.current) clearTimeout(highlightTimer.current)
        setHighlightedId(certificate.id)
        highlightTimer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS)
      }

      if (document.getElementById(`entry-${certificate.id}`)) {
        scrollTo()
        return
      }

      setQuery('')
      requestAnimationFrame(scrollTo)
    },
    [],
  )

  // El temporizador de resaltado se limpia al desmontar.
  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    },
    [],
  )

  const resultLabel = t.search.results(visible.length, certificates.length)

  return (
    <div className="layout">
      {/* Rejilla técnica fija detrás de todo. No interactúa con el ratón. */}
      <div className="tech-grid" aria-hidden="true" />

      <a className="skip-link" href="#contenido">
        {t.header.skipToContent}
      </a>

      <Sidebar
        sections={sections}
        allSectionIds={allSectionIds}
        certificates={certificates}
        query={query}
        onQueryChange={setQuery}
        resultLabel={resultLabel}
        onJump={jumpTo}
      />

      <main id="contenido" className="content">
        {status === 'loading' && <LoadingState />}

        {status === 'error' && (
          <ErrorState
            errorMessage={error}
            isFileProtocolError={isFileProtocolError}
            onRetry={retry}
          />
        )}

        {status === 'ready' && certificates.length === 0 && (
          <EmptyState isFiltered={false} onClear={() => setQuery('')} />
        )}

        {hasData && visible.length === 0 && (
          <EmptyState isFiltered onClear={() => setQuery('')} />
        )}

        {hasData && visible.length > 0 && (
          <>
            <Trajectory
              certificates={certificates}
              matchingIds={visibleIds}
              onSelect={focusEntry}
            />

            <div className="sections">
              {sections.map((section) => (
                <CertificateSectionBlock
                  key={section.category}
                  section={section}
                  onPreview={openPreview}
                  highlightedId={highlightedId}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <PdfModal certificate={preview} onClose={closePreview} />
    </div>
  )
}
