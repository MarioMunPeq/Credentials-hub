import { useLanguage } from '../context/language-context'
import { site } from '../config/site'
import { LanguageToggle } from './LanguageToggle'
import { ThemeToggle } from './ThemeToggle'
import { PortfolioLinks } from './PortfolioLinks'
import { AwardIcon } from './icons'

export function Header() {
  const { language } = useLanguage()

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <div className="site-header__identity">
          <span className="site-header__mark" aria-hidden="true">
            <AwardIcon />
          </span>
          <div className="site-header__identity-text">
            <h1 className="site-header__name">{site.name}</h1>
            <p className="site-header__role">{site.role[language]}</p>
          </div>
        </div>

        <div className="site-header__actions">
          <PortfolioLinks />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}