import { useLanguage } from '../context/language-context'
import { site } from '../config/site'
import { PortfolioLinks } from './PortfolioLinks'

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner container">
        <div className="site-footer__block">
          <span className="site-footer__name">{site.name}</span>
          <span className="site-footer__note">
            {t.footer.rights(site.copyrightYear)} · {t.footer.builtWith}
          </span>
        </div>

        <div className="site-footer__block site-footer__block--end">
          <PortfolioLinks variant="footer" />
          <span className="site-footer__note">{t.footer.dataSource}</span>
        </div>
      </div>
    </footer>
  )
}