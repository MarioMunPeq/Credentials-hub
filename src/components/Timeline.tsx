import { useLanguage } from '../context/language-context'
import type { ProcessedCertificate } from '../types/certificate'
import { categoryAccent, categoryLabel } from '../utils/categories'
import { certificateDateLabel, certificateHoursLabel, groupByYear } from '../utils/certificates'
import { DownloadIcon, ExternalLinkIcon, EyeIcon } from './icons'

interface TimelineProps {
  certificates: ProcessedCertificate[]
  onPreview: (certificate: ProcessedCertificate) => void
}

/**
 * Linea de tiempo de la trayectoria, agrupada por año.
 *
 * El marcado usa una lista semantica con la linea vertical dibujada en CSS, en
 * lugar de un grafico de barras: asi el contenido se lee igual en texto plano
 * y con lector de pantalla.
 */
export function Timeline({ certificates, onPreview }: TimelineProps) {
  const { language, t } = useLanguage()
  const groups = groupByYear(certificates)

  return (
    <div className="timeline">
      {groups.map((group) => (
        <section key={group.year ?? 'sin-fecha'} className="timeline__year">
          <h3 className="timeline__year-label">
            {group.year ?? t.timeline.emptyYear}
          </h3>

          <ol className="timeline__list">
            {group.items.map((certificate) => {
              const dateLabel = certificateDateLabel(certificate, language)
              const hoursLabel = certificateHoursLabel(certificate, language)
              const hasPdf = certificate.pdfUrl !== ''

              return (
                <li key={certificate.id} className="timeline__item">
                  <span
                    className={`timeline__dot ${categoryAccent(certificate.category)}`}
                    aria-hidden="true"
                  />

                  <div className="timeline__content">
                    <div className="timeline__head">
                      <span className="timeline__date">{dateLabel}</span>
                      <span className="timeline__category">
                        {categoryLabel(certificate.category, language)}
                      </span>
                      {hoursLabel && <span className="timeline__hours">{hoursLabel}</span>}
                    </div>

                    <h4 className="timeline__title">{certificate.title}</h4>
                    <p className="timeline__issuer">{certificate.issuer}</p>

                    {certificate.tags.length > 0 && (
                      <ul className="timeline__tags" aria-label={t.toolbar.tags}>
                        {certificate.tags.map((tag) => (
                          <li key={tag} className="tag">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="timeline__actions">
                      {hasPdf && (
                        <>
                          <button
                            type="button"
                            className="button"
                            onClick={() => onPreview(certificate)}
                          >
                            <EyeIcon />
                            <span>{t.card.preview}</span>
                          </button>
                          <a
                            className="button"
                            href={certificate.pdfUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <DownloadIcon />
                            <span>{t.card.download}</span>
                          </a>
                        </>
                      )}
                      {certificate.verifyUrl && (
                        <a
                          className="button button--ghost"
                          href={certificate.verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          title={t.card.verifyTitle}
                        >
                          <ExternalLinkIcon />
                          <span>{t.card.verify}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}