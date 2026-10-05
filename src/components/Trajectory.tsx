import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLanguage } from '../context/language-context'
import type { DisplayCertificate, ProcessedCertificate } from '../types/certificate'
import { formatHours } from '../utils/dates'
import {
  buildTrajectory,
  DOT_SIZE,
  indexLabel,
  placeDots,
  TRACK_MIN_WIDTH,
} from '../utils/certificates'

interface TrajectoryProps {
  /** Todos los certificados, sin filtrar: la escala temporal no cambia al buscar. */
  certificates: ProcessedCertificate[]
  /** Ids que coinciden con la búsqueda. Los demás se atenúan. */
  matchingIds: Set<string>
  onSelect: (certificate: ProcessedCertificate) => void
}

/** Atributo con el id del certificado, para leerlo desde los delegadores. */
const ID_ATTR = 'data-certificate-id'

/** Alto reservado a la ficha, para que la fila no salte al cambiar de contenido. */
const CARD_MIN_HEIGHT = 104

/**
 * Trayectoria: un eje temporal y una ficha de detalle en un sitio fijo.
 *
 * Antes eran siete etiquetas repartidas en cuatro carriles por un algoritmo de
 * colisiones. Era correcto —cero solapes, cero ocultas— pero su salida era el
 * resultado de un cálculo, no una decisión de diseño: obligaba a rastrear un
 * conector de 1px para saber a qué nodo pertenece cada rótulo, y que un cartel
 * estuviera arriba o abajo no significaba nada porque los carriles 0 y 2 son
 * indistinguibles para quien mira.
 *
 * Ahora el eje solo lleva años y puntos, y toda la información de un
 * certificado aparece en una única ficha que no se mueve. Los puntos no
 * codifican las horas con el diámetro: nadie lee "450 h" en un círculo, y un
 * único punto cuatro veces mayor rompía el ritmo de la fila. Las horas van
 * escritas.
 *
 * Interacción:
 * - Con puntero fino, pasar por encima de un punto rellena la ficha y el clic
 *   salta a la entrada, como antes.
 * - En táctil no hay hover, así que un toque rellena la ficha y el salto se hace
 *   desde el enlace que aparece en ella.
 * - La ficha se vacía al salir de la sección, no al salir del punto: si se
 *   vaciara en el punto, el ratón nunca alcanzaría su propio enlace.
 */
export function Trajectory({ certificates, matchingIds, onSelect }: TrajectoryProps) {
  const { language, t } = useLanguage()

  const viewportRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)

  const [trackWidth, setTrackWidth] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  /** `true` si hay ratón: decide si el clic salta o solo rellena la ficha. */
  const finePointer = useRef(false)

  /*
    Ancho real del eje. Se mide porque la separación mínima entre puntos se
    calcula en píxeles: dos certificados separados por seis días están a 4px en
    un eje de 2400px y a 6px en uno de 900.
  */
  useLayoutEffect(() => {
    const element = viewportRef.current
    if (!element) return

    const measure = () => {
      const available = element.clientWidth
      setViewportWidth(available)
      // En móvil el eje conserva un ancho mínimo y el contenedor desplaza.
      setTrackWidth(Math.max(available, TRACK_MIN_WIDTH))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    finePointer.current = window.matchMedia('(pointer: fine)').matches
  }, [])

  const scale = useMemo(
    () => buildTrajectory(certificates, language, trackWidth),
    [certificates, language, trackWidth],
  )

  const dots = useMemo(() => placeDots(scale.points, trackWidth), [scale.points, trackWidth])

  const active = activeId ? scale.points.find((p) => p.certificate.id === activeId) : undefined

  const onScroll = useCallback(() => {
    if (hasScrolled) return
    const element = viewportRef.current
    if (element && element.scrollLeft > 4) setHasScrolled(true)
  }, [hasScrolled])

  if (certificates.length === 0) return null

  const firstYear = scale.years[0] ?? 0
  const lastYear = scale.years[scale.years.length - 1] ?? 0
  // El eje solo desborda en móvil, donde conserva un ancho mínimo. En escritorio
  // la pista "Desliza" no tendría sentido y se oculta del todo.
  const canScroll = trackWidth > viewportWidth + 4

  /** Salta a la entrada y apaga la ficha, que ya ha cumplido su función. */
  const goToEntry = (certificate: ProcessedCertificate) => {
    setActiveId(null)
    onSelect(certificate)
  }

  return (
    <section
      ref={sectionRef}
      className="trajectory"
      id="trajectory"
      aria-labelledby="trajectory-title"
      onPointerLeave={() => setActiveId(null)}
      onFocusCapture={(event) => {
        const id = (event.target as Element).getAttribute(ID_ATTR)
        if (id) setActiveId(id)
      }}
      onBlurCapture={(event) => {
        // Solo se vacía si el foco se va de la sección entera. Con un `onBlur`
        // en cada punto, tabular hasta el enlace de la ficha la borraría.
        const next = event.relatedTarget as Node | null
        if (next && sectionRef.current?.contains(next)) return
        setActiveId(null)
      }}
    >
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
          style={{ width: trackWidth ? `${trackWidth}px` : `${TRACK_MIN_WIDTH}px` }}
        >
          {/* Eje temporal. La banda tiene alto fijo y las marcas cuelgan de ella. */}
          <div className="trajectory__axis" aria-hidden="true" />

          {scale.yearMarks.map((mark, index) => (
            <div
              key={mark.year}
              className="trajectory__year"
              // La primera marca cae en el 0% y la última antes del 100%, así
              // que al centrarlas sobre su tick se saldrían del eje. Se marca el
              // caso y el CSS las empuja hacia dentro.
              data-edge={
                index === 0 ? 'start' : index === scale.yearMarks.length - 1 ? 'end' : 'middle'
              }
              style={{ left: `${mark.left}%` }}
              aria-hidden="true"
            >
              <span className="trajectory__tick" />
              <span className="trajectory__year-label mono">{mark.year}</span>
            </div>
          ))}

          {/* Guía de separación: une la fecha real con el punto desplazado. */}
          {scale.points.map((point) => {
            const dot = dots.get(point.certificate.id)
            if (!dot || dot.shift < 1) return null
            const dimmed = matchingIds.size > 0 && !matchingIds.has(point.certificate.id)
            return (
              <span
                key={`lead-${point.certificate.id}`}
                className={`trajectory__lead${dimmed ? ' trajectory__lead--dimmed' : ''}`}
                style={{
                  left: `${((point.left / 100) * trackWidth).toFixed(1)}px`,
                  width: `${dot.shift.toFixed(1)}px`,
                }}
                aria-hidden="true"
              />
            )
          })}

          {/* Puntos. El orden del array es cronológico, así que Tab los recorre
              en ese orden sin necesidad de tabindex. */}
          {scale.points.map((point) => {
            const dot = dots.get(point.certificate.id)
            if (!dot) return null

            const dimmed = matchingIds.size > 0 && !matchingIds.has(point.certificate.id)
            const selected = activeId === point.certificate.id

            return (
              <button
                key={point.certificate.id}
                type="button"
                {...{ [ID_ATTR]: point.certificate.id }}
                className={`trajectory__dot${dimmed ? ' trajectory__dot--dimmed' : ''}${
                  selected ? ' trajectory__dot--selected' : ''
                }`}
                style={{
                  left: `${dot.left.toFixed(1)}px`,
                  width: `${DOT_SIZE}px`,
                  height: `${DOT_SIZE}px`,
                }}
                aria-label={buildNodeLabel(point.display, t)}
                onPointerEnter={() => setActiveId(point.certificate.id)}
                onFocus={() => setActiveId(point.certificate.id)}
                onClick={() => {
                  setActiveId(point.certificate.id)
                  // Con ratón, el clic va directo a la ficha: la ficha ya está
                  // llena por el hover y saltar sería saltarse el dato.
                  if (finePointer.current) goToEntry(point.certificate)
                }}
              />
            )
          })}
        </div>
      </div>

      {canScroll && (
        <p
          className={`trajectory__hint mono${
            hasScrolled ? ' trajectory__hint--hidden' : ''
          }`}
          aria-hidden="true"
        >
          {t.trajectory.swipeHint}
        </p>
      )}

      <DetailCard
        point={active}
        count={certificates.length}
        totalHours={scale.totalHours}
        onGoToEntry={goToEntry}
      />

      {/* Alternativa de texto: la misma información está en las secciones. */}
      <p className="visually-hidden">{t.trajectory.alternativeText}</p>
    </section>
  )
}

interface DetailCardProps {
  point: { certificate: ProcessedCertificate; display: DisplayCertificate } | undefined
  count: number
  totalHours: number
  onGoToEntry: (certificate: ProcessedCertificate) => void
}

/**
 * Ficha de detalle, siempre en el mismo sitio.
 *
 * En reposo no está vacía: resume el conjunto, para que la sección tenga algo
 * que leer de entrada y para que el hueco no parezca un fallo de maquetación.
 * Con `aria-live` para que el cambio de contenido al mover el ratón se anuncie
 * en un lector de pantalla; el texto no cambia de longitud entre estados, así
 * que no interrumpe lo que se está leyendo.
 */
function DetailCard({ point, count, totalHours, onGoToEntry }: DetailCardProps) {
  const { language, t } = useLanguage()
  // El formato de miles vive en `formatHours`, no en las traducciones: asi el
  // separador y los decimales salen en el idioma activo sin duplicar la regla.
  const hoursLabel = formatHours(totalHours, language)

  return (
    <div className="trajectory__card" style={{ minHeight: `${CARD_MIN_HEIGHT}px` }}>
      <div className="trajectory__card-body" aria-live="polite">
        {point ? (
          <>
            <p className="trajectory__card-meta mono">
              {point.display.dateLabel}
              {point.display.hoursLabel ? ` · ${point.display.hoursLabel}` : ''}
            </p>
            <h3 className="trajectory__card-title">{point.certificate.title}</h3>
            <p className="trajectory__card-issuer">{point.certificate.issuer}</p>
          </>
        ) : (
          <>
            <p className="trajectory__card-meta mono">
              {count} {t.trajectory.certificates}
              {hoursLabel ? ` · ${hoursLabel}` : ''}
            </p>
            <p className="trajectory__card-hint">{t.trajectory.summaryHint}</p>
          </>
        )}
      </div>

      {point && (
        <button
          type="button"
          {...{ [ID_ATTR]: point.certificate.id }}
          className="trajectory__card-link"
          onClick={() => onGoToEntry(point.certificate)}
        >
          {t.trajectory.goToEntry}
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )
}

/**
 * Etiqueta accesible de un punto del eje.
 *
 * Lleva el emisor además del título corto: el punto ya no dibuja el texto al
 * lado, así que para quien no ve el gráfico este es el único sitio donde se
 * menciona quién emite la credencial.
 */
function buildNodeLabel(display: DisplayCertificate, t: ReturnType<typeof useLanguage>['t']) {
  return t.trajectory.nodeLabel(
    display.short,
    display.certificate.issuer,
    display.dateLabel,
  )
}
