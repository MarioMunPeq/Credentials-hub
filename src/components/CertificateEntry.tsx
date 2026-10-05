import { useCallback, useState, type CSSProperties, type PointerEvent } from 'react'
import { useLanguage } from '../context/language-context'
import type { DisplayCertificate, ProcessedCertificate } from '../types/certificate'
import { hoursBarWidth, indexLabel } from '../utils/certificates'
import { DownloadIcon, ExternalLinkIcon } from './icons'
import { PdfThumbnail } from './PdfThumbnail'

interface CertificateEntryProps {
  item: DisplayCertificate
  /** Posición dentro de la sección, para el número de índice. */
  position: number
  /** Horas máximas de la sección, para normalizar la barra. */
  maxHours: number
  onPreview: (certificate: ProcessedCertificate) => void
  /** `true` si la entrada es el destino de un clic en la trayectoria. */
  highlighted: boolean
}

/**
 * Una certificacion.
 *
 * Sin caja ni fondo: la separacion la marca un hairline superior y el aire de
 * padding. La familia ya la dice el título de la sección, así que no se repite.
 *
 * La miniatura del PDF solo se pide en dispositivos con ratón fino: en táctil
 * no hay hover y descargarla sería tirar ancho de banda.
 */
export function CertificateEntry({
  item,
  position,
  maxHours,
  onPreview,
  highlighted,
}: CertificateEntryProps) {
  const { t } = useLanguage()
  const { certificate, dateLabel, hoursLabel } = item

  const [hovered, setHovered] = useState(false)
  const [pointerY, setPointerY] = useState(0)
  const [box, setBox] = useState<{ left: number; width: number } | null>(null)

  const canHover =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  const hasPdf = certificate.pdfUrl !== ''
  const barWidth = hoursBarWidth(certificate.hours, maxHours)

  /*
    La caja de la entrada se mide una vez, al entrar. No en cada `pointermove`: eso
    forzaría un `getBoundingClientRect` por fotograma, que es una lectura de
    disposición en el bucle de eventos y lo ralentiza. Y no hace falta seguirla:
    el contenido solo desplaza en vertical, así que el ancho y el lado izquierdo no
    cambian mientras el puntero sigue dentro.
  */
  const onPointerEnter = useCallback((event: PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setBox({ left: rect.left, width: rect.width })
    setHovered(true)
  }, [])

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    setPointerY(event.clientY)
  }, [])

  return (
    <article
      id={`entry-${certificate.id}`}
      className={`entry revelable revelable--item${highlighted ? ' entry--highlighted' : ''}`}
      // `data-cert-id` lo usa el indice para encontrar la entrada destino.
      data-cert-id={certificate.id}
      // El retardo del revelado escalonado sale de la posicion dentro de la
      // seccion, y lo escribe el CSS a partir de esta variable.
      style={{ '--enter-index': position } as CSSProperties}
      onPointerEnter={canHover ? onPointerEnter : undefined}
      onPointerMove={canHover ? onPointerMove : undefined}
      onPointerLeave={canHover ? () => setHovered(false) : undefined}
    >
      <span className="entry__index mono" aria-hidden="true">
        {indexLabel(position + 1)}
      </span>

      {/*
        El título es lo que abre el PDF. Antes había un enlace «Ver» suelto en la
        fila de acciones que comp competía con «Descargar» por la atención, y
        además obligaba a repetir en una acción lo que el título ya dice: que
        este documento existe y se puede consultar.

        Sin PDF el título se queda como texto plano: un botón que no hace nada es
        peor que no tener botón.
      */}
      <h3 className="entry__title">
        {hasPdf ? (
          <button
            type="button"
            className="entry__title-link"
            aria-haspopup="dialog"
            onClick={() => onPreview(certificate)}
          >
            {certificate.title}
          </button>
        ) : (
          certificate.title
        )}
      </h3>
      <p className="entry__issuer">{certificate.issuer}</p>

      {/* La fecha siempre aparece; las horas solo si el documento las declara. */}
      <p className="entry__meta mono">
        <span>{dateLabel}</span>
        {hoursLabel && (
          <>
            <span className="entry__meta-sep" aria-hidden="true">
              ·
            </span>
            <span>{hoursLabel}</span>
          </>
        )}
      </p>

      {/* Barra proporcional en raíz cuadrada respecto al máximo de la sección. */}
      {barWidth > 0 && (
        <div className="entry__bar" aria-hidden="true">
          <span className="entry__bar-fill" style={{ width: `${barWidth}%` }} />
        </div>
      )}

      <div className="entry__actions actions">
        {hasPdf && (
          <a
            className="actions__download"
            href={certificate.pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.entry.downloadTitle}
            title={t.entry.downloadTitle}
          >
            <DownloadIcon />
          </a>
        )}

        {!hasPdf && <span className="entry__note">{t.entry.missingPdf}</span>}

        {certificate.verifyUrl && (
          <a
            className="actions__link link"
            href={certificate.verifyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            title={t.entry.verifyTitle}
          >
            {t.entry.verify}
            <ExternalLinkIcon />
          </a>
        )}
      </div>

      {canHover && hasPdf && (
        <PdfThumbnail
          url={certificate.pdfUrl}
          active={hovered}
          entryLeft={box?.left ?? null}
          entryWidth={box?.width ?? null}
          pointerY={pointerY}
        />
      )}
    </article>
  )
}