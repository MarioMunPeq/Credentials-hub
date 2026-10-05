import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { useLanguage } from '../context/language-context'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { TRAJECTORY_ID } from '../utils/certificates'
import type { CertificateSection } from '../utils/certificates'

interface SectionNavProps {
  sections: CertificateSection[]
  /** Ids presentes antes de filtrar, para atenuar los que ya no aplican. */
  allIds: string[]
  /** Elemento que desplaza el contenido, para que el scrollspy lo siga. */
  scroller: RefObject<HTMLElement | null>
  onJump: (id: string) => void
}

/**
 * Navegación con números de índice y scrollspy.
 *
 * El resumen va **último y sin número**. Va último porque es el mismo contenido
 * que las secciones de arriba, y sin número porque no es una sección más: si se
 * le pone un número se lee como una sexta categoría.
 *
 * El indicador de la sección activa es **un elemento que se traslada**, no una
 * línea que crece en el enlace activo. Antes cada enlace llevaba su propio
 * `::before` que crecía de 0 a 1,25rem: al cambiar de sección, la anterior se
 * encogía y la nueva crecían en sitios distintos, dos transiciones independientes
 * que se leían como un parpadeo. Con un solo elemento que se desplaza, el
 * movimiento es continuo y se ve de dónde vienes a dónde vas.
 */
export function SectionNav({ sections, allIds, scroller, onJump }: SectionNavProps) {
  const { t } = useLanguage()

  const items = useMemo(
    () => [
      ...sections.map((section) => ({
        id: section.id,
        number: section.number,
        title: section.title,
      })),
      { id: TRAJECTORY_ID, number: '', title: t.trajectory.title },
    ],
    [sections, t.trajectory.title],
  )

  // Solo se observan los ids que existen ahora mismo, para que el efecto siga a
  // los datos.
  const ids = useMemo(() => items.map((item) => item.id), [items])
  const active = useScrollSpy(ids, { scroller })

  const listRef = useRef<HTMLUListElement>(null)
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>())

  /*
    Posición del indicador. Se mide en un `useLayoutEffect` porque si se midiera
    después del pintado se vería el salto: el indicador aparecería en el sitio
    viejo durante un fotograma y luego se movería.

    Se guarda el **punto medio** del enlace y no su alto: el indicador son 2px, y
    con `height: var(--indicator-h)` se convertía en un bloque de 20×44px.
  */
  const placeIndicator = useCallback(() => {
    const list = listRef.current
    const link = active ? linkRefs.current.get(active) : undefined
    if (!list || !link) return

    // `offsetTop` es relativo a la lista, que es el contenedor posicionado del
    // indicador, así que no hay que escalar por ninguna parte. El `-1` compensa la
    // mitad de los 2px del propio indicador para que quede centrado.
    list.style.setProperty('--indicator-y', `${link.offsetTop + link.offsetHeight / 2 - 1}px`)
  }, [active])

  useLayoutEffect(placeIndicator, [placeIndicator, items])

  // La posición depende del ancho: al redimensionar cambia el alto de cada línea.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const observer = new ResizeObserver(placeIndicator)
    observer.observe(list)
    return () => observer.disconnect()
  }, [placeIndicator])

  return (
    <nav className="side-nav" aria-label={t.nav.label}>
      <ul className="side-nav__list" ref={listRef}>
        {/* Un solo indicador para toda la lista. En móvil la lista es una fila
            con scroll y este indicador se oculta: allí lo sustituye el
            subrayado de cada enlace. */}
        <li className="side-nav__indicator" aria-hidden="true" />

        {items.map((item) => {
          // Un item se atenúa si su sección existe en general pero los datos
          // actuales no la tienen.
          const faded = item.id !== TRAJECTORY_ID && !allIds.includes(item.id)

          return (
            <li key={item.id}>
              <a
                ref={(element) => {
                  if (element) linkRefs.current.set(item.id, element)
                  else linkRefs.current.delete(item.id)
                }}
                className={`side-nav__link${faded ? ' side-nav__link--faded' : ''}`}
                href={`#${item.id}`}
                aria-current={active === item.id ? 'true' : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onJump(item.id)
                }}
              >
                {/*
                  El `span` del número se conserva aunque esté vacío, para que los
                  títulos sigan alineados con los de arriba. Si la fila del resumen
                  no lo tuviera, su título se quedaría a la izquierda.
                */}
                <span className="side-nav__number mono" aria-hidden="true">
                  {item.number}
                </span>
                <span className="side-nav__title">{item.title}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}