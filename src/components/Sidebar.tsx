import type { RefObject } from 'react'
import { useLanguage } from '../context/language-context'
import { site } from '../config/site'
import type { ProcessedCertificate } from '../types/certificate'
import type { CertificateSection } from '../utils/certificates'
import { LanguageToggle } from './LanguageToggle'
import { PortfolioMenu } from './PortfolioMenu'
import { SearchField } from './SearchField'
import { SectionNav } from './SectionNav'
import { SiteFooter } from './SiteFooter'
import { ThemeToggle } from './ThemeToggle'

interface SidebarProps {
  sections: CertificateSection[]
  /** Ids de sección presentes antes de filtrar, para atenuar los vacíos. */
  allSectionIds: string[]
  certificates: ProcessedCertificate[]
  query: string
  onQueryChange: (query: string) => void
  resultLabel: string
  /** Elemento que desplaza el contenido, para que el scrollspy lo siga. */
  contentRef: RefObject<HTMLElement | null>
  onJump: (id: string) => void
}

/**
 * Barra lateral en escritorio, cabecera en móvil.
 *
 * Es un solo bloque con dos disposiciones: en escritorio es una columna fija
 * con scroll propio y las herramientas ancladas al final; por debajo de 1024px
 * se convierte en la cabecera superior compacta, con reordenación por áreas de
 * grid. Duplicar el DOM cuesta más que un `order`.
 */
export function Sidebar({
  sections,
  allSectionIds,
  certificates,
  query,
  onQueryChange,
  resultLabel,
  contentRef,
  onJump,
}: SidebarProps) {
  const { language } = useLanguage()

  return (
    <aside className="sidebar" aria-labelledby="site-name">
      <div className="sidebar__identity">
        {/* Único h1 de la página. */}
        <h1 id="site-name" className="sidebar__name">
          {site.name}
        </h1>
        <p className="sidebar__role">{site.role[language]}</p>
      </div>

      <div className="sidebar__tools">
        <PortfolioMenu />
        <div className="sidebar__controls">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>

      <p className="sidebar__intro">{site.hero[language]}</p>

      <div className="sidebar__search">
        <SearchField
          value={query}
          onChange={onQueryChange}
          resultLabel={resultLabel}
        />
      </div>

      <div className="sidebar__nav">
        <SectionNav
          sections={sections}
          allIds={allSectionIds}
          scroller={contentRef}
          onJump={onJump}
        />
      </div>

      <div className="sidebar__footer">
        <SiteFooter certificates={certificates} />
      </div>
    </aside>
  )
}
