import type { ReactNode } from 'react'
import { useLanguage } from '../context/language-context'
import type { ProcessedCertificate } from '../types/certificate'
import { countByCategory, formatTotalHours } from '../utils/certificates'
import { formatNumber } from '../utils/dates'
import { AwardIcon, ClockIcon, LayersIcon } from './icons'

interface StatProps {
  icon: ReactNode
  label: string
  value: string
}

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="stat">
      <span className="stat__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="stat__body">
        <span className="stat__value">{value}</span>
        <span className="stat__label">{label}</span>
      </div>
    </div>
  )
}

/**
 * Contadores resumen del conjunto completo de certificaciones.
 *
 * Calcula siempre sobre TODOS los certificados, no sobre los filtrados: los
 * filtros ya tienen su propio contador de resultados.
 */
export function SummaryStats({ certificates }: { certificates: ProcessedCertificate[] }) {
  const { language, t } = useLanguage()

  const hours = formatTotalHours(certificates, language)
  const categoryCount = countByCategory(certificates).length

  return (
    <section className="summary container" aria-labelledby="summary-title">
      <h2 id="summary-title" className="visually-hidden">
        {t.stats.title}
      </h2>

      <div className="summary__grid">
        <Stat
          icon={<AwardIcon />}
          label={t.stats.certificates}
          value={formatNumber(certificates.length, language)}
        />
        {/* Si ningun certificado declara horas, se omite el bloque en lugar de
            de mostrar un "0 h" que parece un dato real. */}
        {hours !== null && <Stat icon={<ClockIcon />} label={t.stats.hours} value={hours} />}
        <Stat
          icon={<LayersIcon />}
          label={t.stats.categories}
          value={formatNumber(categoryCount, language)}
        />
      </div>
    </section>
  )
}