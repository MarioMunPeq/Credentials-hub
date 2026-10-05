import { useLanguage } from '../context/language-context'
import { site } from '../config/site'

/** Presentacion: nombre, rol y frase corta sobre el alcance del portfolio. */
export function Intro() {
  const { language } = useLanguage()
  const intro = site.intro[language]

  if (!intro) return null

  return (
    <section className="intro container">
      <p className="intro__text">{intro}</p>
    </section>
  )
}