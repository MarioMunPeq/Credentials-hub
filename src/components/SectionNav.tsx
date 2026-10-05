import { useMemo, type RefObject } from 'react'
import { useLanguage } from '../context/language-context'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { indexLabel, TRAJECTORY_ID } from '../utils/certificates'
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
 * La numeración es corrida y sin huecos: las secciones empiezan en la 01 y el
 * resumen, que va último, es el número que le toque. Antes las secciones
 * empezaban en la 02 para dejarle la 01 a la trayectoria, que ya no es una
 * sección sino un resumen y va al final.
 *
 * La sección activa se marca **iluminando la fila entera** —fondo de acento y
 * texto claro— y no con una línea al lado. Antes fue una barra que crecía en el
 * enlace, luego una barra que se desplazaba entre enlaces. Las dos se leían como
 * un tachón sobre el número, no como una selección: una línea horizontal de 2px
 * atravesando el «02» parece que lo censuraba. Un fondo no puede confundirse con
 * nada, y además no hay que medir nada para dibujarlo.
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
      // El resumen hereda el número siguiente al de la última sección, así que
      // la lista queda 01, 02, 03… sin huecos.
      {
        id: TRAJECTORY_ID,
        number: indexLabel(sections.length + 1),
        title: t.trajectory.title,
      },
    ],
    [sections, t.trajectory.title],
  )

  // Solo se observan los ids que existen ahora mismo, para que el efecto siga a
  // los datos.
  const ids = useMemo(() => items.map((item) => item.id), [items])
  const active = useScrollSpy(ids, { scroller })

  return (
    <nav className="side-nav" aria-label={t.nav.label}>
      <ul className="side-nav__list">
        {items.map((item) => {
          // Un item se atenúa si su sección existe en general pero los datos
          // actuales no la tienen.
          const faded = item.id !== TRAJECTORY_ID && !allIds.includes(item.id)

          return (
            <li key={item.id}>
              <a
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
                  títulos sigan alineados con los de arriba. `min-width` en el CSS
                  es lo que hace que un `span` vacío ocupe lo mismo que uno con
                  «02».
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