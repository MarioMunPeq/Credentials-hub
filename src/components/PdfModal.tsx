import { useEffect, useRef, type ReactNode } from 'react'
import { useLanguage } from '../context/language-context'
import type { ProcessedCertificate } from '../types/certificate'
import { categoryAccent, categoryLabel } from '../utils/categories'
import { certificateDateLabel, certificateHoursLabel } from '../utils/certificates'
import { CloseIcon, DownloadIcon, ExternalLinkIcon } from './icons'

interface PdfModalProps {
  certificate: ProcessedCertificate | null
  onClose: () => void
}

/**
 * Vista previa del PDF en un dialogo modal.
 *
 * Decisiones de accesibilidad:
 * - `role="dialog"` + `aria-modal` + etiqueta y descripcion asociadas.
 * - El foco entra en el boton de cerrar y vuelve al elemento que abrio el
 *   modal (lo gestiona App, que es quien lo cierra).
 * - Escape cierra. Tab queda atrapado dentro del dialogo.
 * - El scroll del fondo se bloquea mientras el modal esta abierto.
 *
 * Se usa `<object>` en lugar de `<iframe>` porque permite contenido de
 * reserva: si el navegador no sabe mostrar PDFs, aparece un enlace de descarga
 * en lugar de un hueco en blanco.
 */
export function PdfModal({ certificate, onClose }: PdfModalProps) {
  const { language, t } = useLanguage()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const isOpen = certificate !== null

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable || focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!certificate) return null

  const titleId = 'pdf-modal-title'
  const descriptionId = 'pdf-modal-description'
  const dateLabel = certificateDateLabel(certificate, language)
  const hoursLabel = certificateHoursLabel(certificate, language)

  return (
    <div
      className="modal-backdrop"
      // El clic en el fondo cierra; los clics dentro se detienen abajo.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className={`modal__header ${categoryAccent(certificate.category)}`}>
          <div className="modal__heading">
            <span className="modal__category">
              {categoryLabel(certificate.category, language)}
            </span>
            <h2 id={titleId} className="modal__title">
              {certificate.title}
            </h2>
            <p id={descriptionId} className="modal__subtitle">
              {certificate.issuer}
              <span className="modal__dot" aria-hidden="true">
                ·
              </span>
              {dateLabel}
              {hoursLabel && (
                <>
                  <span className="modal__dot" aria-hidden="true">
                    ·
                  </span>
                  {hoursLabel}
                </>
              )}
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="icon-button modal__close"
            onClick={onClose}
            aria-label={t.modal.close}
            title={t.modal.close}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="modal__body">
          {certificate.pdfUrl ? (
            <object
              className="modal__viewer"
              data={certificate.pdfUrl}
              type="application/pdf"
              aria-label={certificate.title}
            >
              <ModalFallback certificate={certificate} />
            </object>
          ) : (
            <ModalFallback certificate={certificate} />
          )}
        </div>

        <footer className="modal__footer">
          <p className="modal__hint">{t.modal.openedIn}</p>
          <div className="modal__footer-actions">
            {certificate.verifyUrl && (
              <a
                className="button button--ghost"
                href={certificate.verifyUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <ExternalLinkIcon />
                <span>{t.card.verify}</span>
              </a>
            )}
            <a
              className="button button--primary"
              href={certificate.pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <DownloadIcon />
              <span>{t.card.download}</span>
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

/** Contenido de reserva cuando el navegador no incrusta el PDF. */
function ModalFallback({ certificate }: { certificate: ProcessedCertificate }): ReactNode {
  const { t } = useLanguage()

  return (
    <div className="modal__fallback">
      <p>{t.modal.noPreview}</p>
      {certificate.pdfUrl && (
        <a
          className="button button--primary"
          href={certificate.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <DownloadIcon />
          <span>{t.modal.openInNewTab}</span>
        </a>
      )}
    </div>
  )
}