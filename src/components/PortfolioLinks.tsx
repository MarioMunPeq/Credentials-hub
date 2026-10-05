import { useLanguage } from '../context/language-context'
import { site } from '../config/site'
import { LinkIcon } from './icons'

/**
 * Enlace de vuelta al conjunto de portfolios del autor.
 *
 * Con un solo destino se muestra un boton directo; con varios, un `<select>`
 * que navega al elegir una opcion. Si el array de `site.portfolios` esta
 * vacio, no se renderiza nada.
 */
export function PortfolioLinks({ variant = 'header' }: { variant?: 'header' | 'footer' }) {
  const { t } = useLanguage()
  const portfolios = site.portfolios

  if (portfolios.length === 0) return null

  const first = portfolios[0]

  if (portfolios.length === 1 && first) {
    return (
      <a
        className={variant === 'header' ? 'portfolio-link' : 'footer-link'}
        href={first.url}
        target="_blank"
        rel="noopener noreferrer"
        title={first.description}
      >
        <LinkIcon />
        <span>{t.header.portfolios}</span>
      </a>
    )
  }

  return (
    <div className="portfolio-picker">
      <label className="portfolio-picker__label" htmlFor="portfolio-select">
        <LinkIcon />
        <span>{t.header.portfolios}</span>
      </label>
      <select
        id="portfolio-select"
        className="portfolio-picker__select"
        defaultValue=""
        aria-label={t.header.portfoliosLabel}
        onChange={(event) => {
          const url = event.target.value
          if (url) window.open(url, '_blank', 'noopener,noreferrer')
          // Permite volver a elegir la misma opcion mas adelante.
          event.target.value = ''
        }}
      >
        <option value="" disabled>
          {t.header.portfoliosPlaceholder}
        </option>
        {portfolios.map((portfolio) => (
          <option key={portfolio.url} value={portfolio.url}>
            {portfolio.label}
          </option>
        ))}
      </select>
    </div>
  )
}