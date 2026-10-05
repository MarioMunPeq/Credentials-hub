import { useMemo, type CSSProperties } from 'react'
import { useLanguage } from '../context/language-context'
import { formatHours } from '../utils/dates'
import { buildSections, indexLabel, TRAJECTORY_ID } from '../utils/certificates'
import type { ProcessedCertificate } from '../types/certificate'

interface CredentialIndexProps {
  certificates: ProcessedCertificate[]
  onSelect: (certificate: ProcessedCertificate) => void
}

/**
 * Sección 01: resumen de las certificaciones.
 *
 * Antes era una línea de tiempo y durante tres versiones fue un gráfico: siete
 * etiquetas en cuatro carriles, luego un eje limpio con ficha bajo demanda, luego
 * bandas por año con barras de horas. Las tres se leían bien y las tres estaban
 * mal, por la misma razón: **siete eventos en ocho años no son un conjunto de
 * datos que premie un gráfico**, y las secciones de debajo ya listan cada
 * certificado con nombre, entidad, horas y PDF. El gráfico codificaba algo que
 * estaba en otro sitio, peor.
 *
 * Así que esto no codifica: **resume**. Siete fichas compactas en orden
 * cronológico, cada una con año, título corto, horas y categoría, y cada una
 * pulsable para llevar a su entrada.
 *
 * Y se declara como lo que es, un resumen, en dos sitios: en el título y en una
 * línea que lo dice. La section 01 es el mismo contenido que las secciones 02 a
 * 05, compactado; sin esa frase se lee como una sexta categoría más, y entonces
 * parece contenido que no está en ninguna parte.
 *
 * Sin color por categoría: la hoja de tokens declara un único acento y no lo usa
 * en superficies grandes. Cuatro colores aquí romperían esa regla y, además, no
 * aportarían nada que el texto de la categoría no diga ya.
 */
export function CredentialIndex({ certificates, onSelect }: CredentialIndexProps) {
  const { language, t } = useLanguage()

  const sections = useMemo(() => buildSections(certificates, language), [certificates, language])

  const items = useMemo(
    () =>
      sections
        .flatMap((section) => section.items.map((item) => ({ item, title: section.title })))
        .sort((a, b) => a.item.certificate.sortKey - b.item.certificate.sortKey),
    [sections],
  )

  const totalHours = certificates.reduce((sum, c) => sum + c.hours, 0)

  return (
    <section className="index entrada entrada--l2" id={TRAJECTORY_ID} aria-labelledby="index-title">
      <div className="index__head">
        {/*
          El número va en la línea del antetítulo, no como el número grande de
          una sección. Así el resumen está numerado igual que las demás —y el
          menú lateral y la cabecera dicen lo mismo— sin que la cabecera vuelva a
          parecer la de una sección: el número va en cuerpo de metadatos, no a 28px.
        */}
        <span className="index__kicker mono">
          {indexLabel(sections.length + 1)} · {t.trajectory.kicker}
        </span>
        <h2 id="index-title" className="index__title">
          {t.trajectory.title}
        </h2>
        <p className="index__note">{t.trajectory.summaryNote}</p>
      </div>

      <div className="index__top">
        <span className="index__summary mono">
          {t.trajectory.summary(items.length, formatHours(totalHours, language))}
        </span>
        <span className="index__hint mono" aria-hidden="true">
          {t.trajectory.summaryHint}
        </span>
      </div>

      <ul className="index__grid">
        {items.map(({ item, title }, position) => (
          <li key={item.certificate.id}>
            <button
              type="button"
              className="index__item entrada"
              onClick={() => onSelect(item.certificate)}
              // El retardo de la entrada escalonada sale de la posición: sin esto
              // las siete fichas aparecerían a la vez.
              style={{ '--enter-index': position } as CSSProperties}
            >
              <span className="index__year mono">
                {item.certificate.dateParts.year ?? '—'}
              </span>
              <span className="index__name">{item.short}</span>
              <span className="index__meta mono">{item.hoursLabel ?? item.dateLabel}</span>
              <span className="index__category mono">{title}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}