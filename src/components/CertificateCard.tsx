import { useLanguage } from '../context/language-context'
import type { ProcessedCertificate } from '../types/certificate'
import { categoryAccent, categoryLabel } from '../utils/categories'
import { certificateDateLabel, certificateHoursLabel } from '../utils/certificates'
import { DownloadIcon, ExternalLinkIcon, EyeIcon } from './icons'

interface CertificateCardProps {
  certificate: ProcessedCertificate
  onPreview: (certificate: ProcessedCertificate) => void
  headingLevel?: 'h2' | 'h3'
}

/** Tarjeta de un certificado, usada en la vista de cuadrícula. */
export function CertificateCard({
  certificate,
  onPreview,
  headingLevel: Heading = 'h3',
}: CertificateCardProps) {
  const { language, t } = useLanguage()

  const dateLabel = certificateDateLabel(certificate, language)
  const hoursLabel = certificateHoursLabel(certificate, language)
  const accent = categoryAccent(certificate.category)
  const hasPdf = certificate.pdfUrl !== ''

  return (
    <article className={`card ${accent}`}>
      <header className="card__header">
        <span className="card__category">{categoryLabel(certificate.category, language)}</span>
        <Heading className="card__title">{certificate.title}</Heading>
        <p className="card__issuer">{certificate.issuer}</p>
      </header>

      <dl className="card__meta">
        <div className="card__meta-item">
          <dt>{t.card.issuedOn}</dt>
          <dd>{dateLabel}</dd>
        </div>
        {hoursLabel && (
          <div className="card__meta-item">
            <dt>{t.card.duration}</dt>
            <dd>{hoursLabel}</dd>
          </div>
        )}
      </dl>

      {certificate.tags.length > 0 && (
        <ul className="card__tags" aria-label={t.toolbar.tags}>
          {certificate.tags.map((tag) => (
            <li key={tag} className="tag">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <footer className="card__actions">
        {hasPdf ? (
          <>
            <button
              type="button"
              className="button button--primary"
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
        ) : (
          <span className="card__no-pdf">{t.card.missingPdf}</span>
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
      </footer>
    </article>
  )
}