import { useMemo } from 'react'
import { useLanguage } from '../context/language-context'
import { useScrollSpy } from '../hooks/useScrollSpy'
import { indexLabel, TRAJECTORY_ID } from '../utils/certificates'
import type { CertificateSection } from '../utils/certificates'

interface SectionNavProps {
  sections: CertificateSection[]
  /** Ids presentes antes de filtrar, para atenuar los que ya no aplican. */
  allIds: string[]
  onJump: (id: string) => void
}

/**
 * Navegación vertical con números de índice y scrollspy.
 *
 * El número delatan en qué punto de la trayectoria se está leyendo, que es la
 * información que aporta el gráfico: no solo en qué sección, sino cuántas
 * quedan.
 */
export function SectionNav({ sections, allIds, onJump }: SectionNavProps) {
  const { t } = useLanguage()

  const items = useMemo(
    () => [
      { id: TRAJECTORY_ID, number: indexLabel(1), title: t.trajectory.title },
      ...sections.map((section) => ({
        id: section.id,
        number: section.number,
        title: section.title,
      })),
    ],
    [sections, t.trajectory.title],
  )

  // Solo se observan los ids que existen ahora mismo, para que el efecto siga
  // a la búsqueda.
  const ids = useMemo(() => items.map((item) => item.id), [items])
  const active = useScrollSpy(ids)

  return (
    <nav className="side-nav" aria-label={t.nav.label}>
      <ul className="side-nav__list">
        {items.map((item) => {
          // Un item se atenúa si su sección existe en general pero la búsqueda
          // la ha dejado vacía.
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
