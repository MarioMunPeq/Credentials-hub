import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { CredentialIndex } from './components/CredentialIndex'
import { CertificateSectionBlock } from './components/CertificateSection'
import { PdfModal } from './components/PdfModal'
import { CursorReticle } from './components/CursorReticle'
import { ErrorState, EmptyState, LoadingState } from './components/states'
import { useCertificates } from './hooks/useCertificates'
import { useScrollThumb } from './hooks/useScrollThumb'
import { useRevealOnScroll } from './hooks/useRevealOnScroll'
import { useLanguage } from './context/language-context'
import { site } from './config/site'
import { buildSections } from './utils/certificates'
import type { ProcessedCertificate } from './types/certificate'

/** Cuánto dura el resaltado de la entrada destino de la trayectoria. */
const HIGHLIGHT_MS = 1600

export function App() {
  const { language, t } = useLanguage()
  const { status, certificates, error, isFileProtocolError, retry } = useCertificates()

  const [preview, setPreview] = useState<ProcessedCertificate | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Elemento que abrió el modal, para devolverle el foco al cerrarlo.
  const previewTriggerRef = useRef<HTMLElement | null>(null)
  // Área de contenido: es la que desplaza en escritorio, así que el scrollspy
  // necesita conocerla.
  const contentRef = useRef<HTMLElement>(null)

  // Indicador de scroll propio: sustituye a la barra esmeralda del navegador.
  useScrollThumb(contentRef)
  // Las entradas de certificado aparecen cuando entran en pantalla.
  useRevealOnScroll(contentRef)

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

  const sections = useMemo(
    () => buildSections(certificates, language),
    [certificates, language],
  )

  /** Secciones completas: permiten atenuar los ítems de navegación sin datos. */
  const allSectionIds = useMemo(
    () => sections.map((section) => section.id),
    [sections],
  )

  const hasData = status === 'ready' && certificates.length > 0

  /** Salta a una sección compensando el borde fijo del área de contenido. */
  const jumpTo = useCallback((id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /*
    Clic en una ficha del resumen: lleva a la entrada y la resalta.
    `buildSections` no filtra nada, así que la entrada siempre está en el DOM.
  */
  const focusEntry = useCallback((certificate: ProcessedCertificate) => {
    const target = document.getElementById(`entry-${certificate.id}`)
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    setHighlightedId(certificate.id)
    highlightTimer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS)
  }, [])

  // El temporizador de resaltado se limpia al desmontar.
  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    },
    [],
  )

  return (
    <div className="layout">
      {/* Rejilla técnica fija detrás de todo. No interactúa con el ratón. */}
      <div className="tech-grid" aria-hidden="true" />

      <CursorReticle />

      <a className="skip-link" href="#contenido">
        {t.header.skipToContent}
      </a>

      <Sidebar
        sections={sections}
        allSectionIds={allSectionIds}
        certificates={certificates}
        contentRef={contentRef}
        onJump={jumpTo}
      />

      <main id="contenido" className="content" ref={contentRef}>
        {status === 'loading' && <LoadingState />}

        {status === 'error' && (
          <ErrorState
            errorMessage={error}
            isFileProtocolError={isFileProtocolError}
            onRetry={retry}
          />
        )}

        {status === 'ready' && certificates.length === 0 && <EmptyState />}

        {hasData && (
          <>
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

            {/* El resumen va al final, no al principio. Es el mismo contenido que
                las secciones de arriba, así que ponerlo delante hacía que el
                visitante lo leyera dos veces y además leía el contenido en un
                formato que no era el bueno. Al final se lee como el cierre. */}
            <CredentialIndex certificates={certificates} onSelect={focusEntry} />
          </>
        )}
      </main>

      <PdfModal certificate={preview} onClose={closePreview} />
    </div>
  )
}
