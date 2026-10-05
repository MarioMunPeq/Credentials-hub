import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../context/language-context'
import type { TranslationShape } from '../i18n/translations'
import type { DisplayCertificate, ProcessedCertificate } from '../types/certificate'
import {
  AXIS_LABEL_OFFSET,
  buildTrajectory,
  indexLabel,
  LANE_HEIGHT,
  placeLabels,
  TRACK_MIN_WIDTH,
} from '../utils/certificates'

interface TrajectoryProps {
  /** Todos los certificados, sin filtrar: la escala temporal no cambia al buscar. */
  certificates: ProcessedCertificate[]
  /** Ids que coinciden con la búsqueda. Los demás se atenúan. */
  matchingIds: Set<string>
  onSelect: (certificate: ProcessedCertificate) => void
}

interface TooltipState {
  id: string
  x: number
  y: number
}

/** Alto aproximado de una etiqueta (título + fecha), en px. */
const LABEL_HEIGHT = 38

/** Alto reservado bajo el eje para las marcas de año, en px. */
const YEAR_HEIGHT = 30

/** Alto mínimo de la zona del eje, en px. */
const MIN_AXIS_BAND = 96

/** Ancho del tooltip, para poder mantenerlo dentro del viewport. */
const TOOLTIP_WIDTH = 260

const VIEWPORT_MARGIN = 10

/**
 * Trayectoria: línea de tiempo horizontal a escala temporal real.
 *
 * El dominio va del 1 de enero del año más antiguo al 31 de diciembre del más
 * reciente, así que dos certificados de mayo y de septiembre están a la
 * distancia que les corresponde y no a la que les toque por orden.
 *
 * El diámetro de cada nodo es proporcional a la raíz cuadrada de las horas: el
 * área es fiel al valor, mientras que un diámetro proporcional achicaría las
 * diferencias grandes.
 */
export function Trajectory({ certificates, matchingIds, onSelect }: TrajectoryProps) {
  const { language, t } = useLanguage()

  const viewportRef = useRef<HTMLDivElement>(null)

  const [trackWidth, setTrackWidth] = useState(0)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  // Ancho real del eje. Se mide porque las colisiones se calculan en píxeles:
  // dos puntos muy juntos en porcentaje pueden quedar muy lejos o muy cerca
  // según lo ancho que tenga la pantalla.
  useLayoutEffect(() => {
    const element = viewportRef.current
    if (!element) return

    const measure = () => {
      // En móvil el eje conserva un ancho mínimo y el contenedor desplaza.
      setTrackWidth(Math.max(element.clientWidth, TRACK_MIN_WIDTH))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale = useMemo(
    () => buildTrajectory(certificates, language, trackWidth),
    [certificates, language, trackWidth],
  )

  const placements = useMemo(
    () =>
      placeLabels(scale.points, trackWidth, {
        laneHeight: LANE_HEIGHT,
        axisOffset: AXIS_LABEL_OFFSET,
      }),
    [scale.points, trackWidth],
  )

  /*
    Geometría vertical. El eje no se sitúa al 50% sino justo debajo de la
    etiqueta más alta que haya quedado arriba, para que una segunda fila de
    etiquetas no se salga de la caja.
  */
  const geometry = useMemo(() => {
    let above = 0
    let below = 0

    for (const placement of placements.values()) {
      if (!placement.visible) continue
      const needed = Math.abs(placement.offset) + LABEL_HEIGHT
      if (placement.offset < 0) above = Math.max(above, needed)
      else below = Math.max(below, needed)
    }

    const axisTop = Math.max(MIN_AXIS_BAND, above)
    return { axisTop, height: axisTop + Math.max(YEAR_HEIGHT, below) }
  }, [placements])

  const onScroll = useCallback(() => {
    if (hasScrolled) return
    const element = viewportRef.current
    if (element && element.scrollLeft > 4) setHasScrolled(true)
  }, [hasScrolled])

  const activePoint = tooltip
    ? scale.points.find((point) => point.certificate.id === tooltip.id)
    : undefined

  if (certificates.length === 0) return null

  const firstYear = scale.years[0] ?? 0
  const lastYear = scale.years[scale.years.length - 1] ?? 0

  return (
    <section id="trajectory" className="trajectory" aria-labelledby="trajectory-title">
      <div className="trajectory__head">
        <span className="section__index mono" aria-hidden="true">
          {indexLabel(1)}
        </span>
        <h2 id="trajectory-title" className="section__title">
          {t.trajectory.title}
        </h2>
        <span className="trajectory__range mono">
          {t.trajectory.yearRange(firstYear, lastYear)}
        </span>
      </div>

      <div
        ref={viewportRef}
        className="trajectory__viewport"
        onScroll={onScroll}
        role="region"
        aria-label={t.trajectory.regionLabel}
      >
        <div
          className="trajectory__track"
          style={{
            width: trackWidth ? `${trackWidth}px` : `${TRACK_MIN_WIDTH}px`,
            height: `${geometry.height}px`,
          }}
        >
          {/* Eje temporal */}
          <div
            className="trajectory__axis"
            style={{ top: `${geometry.axisTop}px` }}
            aria-hidden="true"
          />

          {/* Marcas de año, con tick y guía hacia arriba */}
          {scale.yearMarks.map((mark) => (
            <div
              key={mark.year}
              className="trajectory__year"
              style={{ left: `${mark.left}%`, top: `${geometry.axisTop}px` }}
              aria-hidden="true"
            >
              <span className="trajectory__guide" />
              <span className="trajectory__tick" />
              <span className="trajectory__year-label mono">{mark.year}</span>
            </div>
          ))}

          {/* Nodos. El orden del array es cronológico, así que Tab los recorre
              en ese orden sin necesidad de tabindex. */}
          {scale.points.map((point) => {
            const dimmed = matchingIds.size > 0 && !matchingIds.has(point.certificate.id)
            return (
              <button
                key={point.certificate.id}
                type="button"
                className={`trajectory__node${dimmed ? ' trajectory__node--dimmed' : ''}`}
                style={{
                  left: `${point.left}%`,
                  top: `${geometry.axisTop}px`,
                  width: `${point.size}px`,
                  height: `${point.size}px`,
                }}
                aria-label={buildNodeLabel(point.display, t)}
                onClick={() => onSelect(point.certificate)}
                onPointerEnter={(event) =>
                  setTooltip({ id: point.certificate.id, x: event.clientX, y: event.clientY })
                }
                onPointerMove={(event) =>
                  setTooltip({ id: point.certificate.id, x: event.clientX, y: event.clientY })
                }
                onPointerLeave={() => setTooltip(null)}
                onFocus={(event) => {
                  const box = event.currentTarget.getBoundingClientRect()
                  setTooltip({
                    id: point.certificate.id,
                    x: box.left + box.width / 2,
                    y: box.top,
                  })
                }}
                onBlur={() => setTooltip(null)}
              />
            )
          })}

          {/* Etiquetas cortas, en carriles para que no se solapen */}
          {scale.points.map((point) => {
            const placement = placements.get(point.certificate.id)
            // Si no ha cabido en ningun carril, el nodo conserva su tooltip.
            if (!placement || !placement.visible) return null

            return (
              <div
                key={`label-${point.certificate.id}`}
                className="trajectory__label"
                style={{
                  left: `${placement.left}px`,
                  top: `${geometry.axisTop + placement.offset}px`,
                  width: `${placement.width}px`,
                }}
                aria-hidden="true"
              >
                <span className="trajectory__label-title">{point.display.short}</span>
                <span className="trajectory__label-date mono">
                  {point.display.dateLabel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p
        className={`trajectory__hint mono${
          hasScrolled ? ' trajectory__hint--hidden' : ''
        }`}
        aria-hidden="true"
      >
        {t.trajectory.swipeHint}
      </p>

      {/* Alternativa de texto: la misma información está en las secciones. */}
      <p className="visually-hidden">{t.trajectory.alternativeText}</p>

      {tooltip && activePoint && (
        <TrajectoryTooltip display={activePoint.display} x={tooltip.x} y={tooltip.y} />
      )}
    </section>
  )
}

/** Etiqueta accesible de un nodo: título, entidad, fecha y horas. */
function buildNodeLabel(display: DisplayCertificate, t: TranslationShape): string {
  const meta = [display.dateLabel, display.hoursLabel].filter(Boolean).join(', ')
  const { title, issuer } = display.certificate

  return issuer ? t.trajectory.nodeLabel(title, issuer, meta) : t.trajectory.nodeLabelShort(title, meta)
}

interface TrajectoryTooltipProps {
  display: DisplayCertificate
  x: number
  y: number
}

/**
 * Tooltip del nodo, en `position: fixed` para que ningún `overflow` lo recorte.
 * Se ancla al borde derecho si no cabe a la derecha, y se voltea arriba si no
 * cabe debajo.
 */
function TrajectoryTooltip({ display, x, y }: TrajectoryTooltipProps) {
  const flipped = x > window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN * 3
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, flipped ? x - TOOLTIP_WIDTH - 16 : x + 16),
    window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN,
  )

  const above = y > window.innerHeight / 2

  return (
    <div
      className="trajectory__tooltip"
      role="presentation"
      style={{
        left,
        ...(above
          ? { bottom: window.innerHeight - y + 16 }
          : { top: y + 18 }),
      }}
    >
      <p className="trajectory__tooltip-title">{display.certificate.title}</p>
      <p className="trajectory__tooltip-issuer">{display.certificate.issuer}</p>
      <p className="trajectory__tooltip-meta mono">
        {[display.dateLabel, display.hoursLabel].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}