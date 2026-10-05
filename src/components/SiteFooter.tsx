import { useLanguage } from '../context/language-context'
import { repositoryUrl } from '../config/links'
import { site } from '../config/site'
import type { ProcessedCertificate } from '../types/certificate'
import { formatLongDate, latestCertificateDate } from '../utils/certificates'

/**
 * Pie en una sola línea, anclado al final de la barra lateral.
 *
 * La fecha no se guarda a mano: se deduce de la certificación más reciente del
 * JSON, así que no puede quedarse desfasada.
 */
export function SiteFooter({ certificates }: { certificates: ProcessedCertificate[] }) {
  const { language, t } = useLanguage()
  const latest = latestCertificateDate(certificates)

  return (
    <div className="side-footer">
      <p className="side-footer__line">
        <span>
          © {new Date().getFullYear()} {site.name}
        </span>
      </p>

      <p className="side-footer__line">
        <a href={repositoryUrl} target="_blank" rel="noopener noreferrer" className="link">
          {t.footer.repository}
        </a>
      </p>

      {latest && (
        <p className="side-footer__line">
          <span className="side-footer__muted">
            {t.footer.updated}: {formatLongDate(latest, language)}
          </span>
        </p>
      )}
    </div>
  )
}
