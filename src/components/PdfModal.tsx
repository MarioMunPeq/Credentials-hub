import { useEffect, useId, useRef } from 'react'
import { useLanguage } from '../context/language-context'
import type { ProcessedCertificate } from '../types/certificate'
import { certificateDateLabel, certificateHoursLabel } from '../utils/certificates'
import { CloseIcon, DownloadIcon } from './icons'

interface PdfModalProps {
  certificate: ProcessedCertificate | null
  onClose: () => void
}

/** Elementos que pueden recibir foco dentro del modal. */
const FOCUSABLE =
  'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'

/**
 * Vista previa del PDF.
 *
 * Accesibilidad:
 * - `role="dialog"` + `aria-modal`, con titulo y etiqueta asociados.
 * - El foco entra en el boton de cerrar y se mantiene dentro del dialogo.
 * - Escape y clic en el overlay cierran; el scroll del fondo se bloquea.
 *
 * El visor es un `<object>` y no un `<iframe>` a proposito: `<object>` admite
 * contenido de reserva, asi que si el navegador no sabe mostrar PDFs aparece
 * un enlace en lugar de un hueco en blanco.
 */
export function PdfModal({ certificate, onClose }: PdfModalProps) {
  const { language, t } = useLanguage()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const titleId = useId()
  const labelId = useId()

  const isOpen = certificate !== null

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      // Trampa de foco: el ciclo no puede salirse del dialogo.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
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

  const date = certificateDateLabel(certificate, language)
  const hours = certificateHoursLabel(certificate, language)

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        // Solo cierra si el gesto empieza en el propio overlay.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={labelId}
      >
        <header className="modal__header">
          <div className="modal__heading">
            <h2 id={titleId} className="modal__title">
              {certificate.title}
            </h2>
            <p className="modal__subtitle" id={labelId}>
              {certificate.issuer}
              {hours ? ` · ${date} · ${hours}` : ` · ${date}`}
            </p>
          </div>

          <div className="modal__tools">
            {certificate.pdfUrl && (
              <a
                className="link"
                href={certificate.pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.modal.download}
                <DownloadIcon />
              </a>
            )}

            <button
              ref={closeRef}
              type="button"
              className="modal__close"
              onClick={onClose}
              aria-label={t.modal.close}
              title={t.modal.close}
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="modal__body">
          {certificate.pdfUrl ? (
            <object
              className="modal__viewer"
              data={certificate.pdfUrl}
              type="application/pdf"
              aria-labelledby={labelId}
            >
              <ModalFallback url={certificate.pdfUrl} />
            </object>
          ) : (
            <ModalFallback url="" />
          )}
        </div>
      </div>
    </div>
  )
}

/** Contenido de reserva cuando el navegador no incrusta el PDF. */
function ModalFallback({ url }: { url: string }) {
  const { t } = useLanguage()

  return (
    <div className="modal__fallback">
      <p>{t.modal.noPreview}</p>
      {url && (
        <a className="link" href={url} target="_blank" rel="noopener noreferrer">
          {t.modal.openPdf}
        </a>
      )}
    </div>
  )
}