import type { DisplayCertificate, ProcessedCertificate } from '../types/certificate'
import type { CertificateSection } from '../utils/certificates'
import { CertificateEntry } from './CertificateEntry'

interface CertificateSectionBlockProps {
  section: CertificateSection
  onPreview: (certificate: ProcessedCertificate) => void
  /** Id de la entrada resaltada desde la trayectoria. */
  highlightedId: string | null
}

/**
 * Bloque de una categoria: numero de indice, titulo, contador y rejilla de
 * entradas, mas reciente primero.
 *
 * Una seccion sin resultados no llega a pintarse: `buildSections` ya las
 * descarta, de modo que aqui no hace falta comprobar nada.
 */
export function CertificateSectionBlock({
  section,
  onPreview,
  highlightedId,
}: CertificateSectionBlockProps) {
  return (
    <section
      id={section.id}
      className="section"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="section__head">
        <span className="section__index mono" aria-hidden="true">
          {section.number}
        </span>
        <h2 id={`${section.id}-title`} className="section__title">
          {section.title}
        </h2>
        <span className="section__count mono">{section.items.length}</span>
      </div>

      <div className="section__grid">
        {section.items.map((item: DisplayCertificate, position) => (
          <CertificateEntry
            key={item.certificate.id}
            item={item}
            position={position}
            maxHours={section.maxHours}
            onPreview={onPreview}
            highlighted={highlightedId === item.certificate.id}
          />
        ))}
      </div>
    </section>
  )
}