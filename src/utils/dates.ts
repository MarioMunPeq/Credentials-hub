import type { Language } from '../i18n/translations'

const MONTHS: Record<Language, string[]> = {
  es: [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ],
  en: [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ],
}

export interface DateParts {
  year: number | null
  month: number | null
  day: number | null
}

export interface ParsedDate extends DateParts {
  /** Clave numerica AAAAMMDD para ordenar de forma fiable. */
  sortKey: number
  /** Texto ya formateado en el idioma pedido. */
  label: string
}

/**
 * Interpreta una fecha en formato "YYYY", "YYYY-MM" o "YYYY-MM-DD" y la
 * devuelve con su etiqueta formateada y una clave de ordenacion.
 *
 * No usa `new Date(string)` a proposito: ese constructor interpreta las fechas
 * ISO como UTC y puede desplazar el dia en zonas horarias negativas.
 */
export function parseDate(raw: string, lang: Language): ParsedDate {
  const match = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(raw.trim())

  if (!match) {
    return { year: null, month: null, day: null, sortKey: 0, label: raw.trim() || '—' }
  }

  const year = Number(match[1])
  const month = match[2] ? Number(match[2]) : null
  const day = match[3] ? Number(match[3]) : null

  const safeMonth = month !== null && month >= 1 && month <= 12 ? month : null
  const safeDay = day !== null && safeMonth !== null && day >= 1 && day <= 31 ? day : null

  return {
    year,
    month: safeMonth,
    day: safeDay,
    sortKey: year * 10000 + (safeMonth ?? 0) * 100 + (safeDay ?? 0),
    label: formatDateParts({ year, month: safeMonth, day: safeDay }, lang),
  }
}

/**
 * Formatea las partes de una fecha ya validadas. Admite fechas parciales:
 * "2025", "mar 2025" y "14 mar 2025".
 */
export function formatDateParts(parts: DateParts, lang: Language): string {
  const { year, month, day } = parts
  if (year === null) return '—'

  const monthLabel = month !== null ? MONTHS[lang][month - 1] : undefined

  let label = String(year)
  if (monthLabel) label = `${monthLabel} ${year}`
  if (month !== null && !monthLabel) label = `${String(month).padStart(2, '0')} ${year}`
  if (day !== null) label = `${String(day).padStart(2, '0')} ${label}`

  return label
}

/** Convierte las horas del JSON a numero. Devuelve 0 si no hay dato usable. */
export function toHours(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value)

  if (typeof value === 'string') {
    // Acepta "1.200 h", "40h", "1200 horas" y similares.
    const parsed = Number.parseFloat(value.replace(/[^\d.,-]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'))
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }

  return 0
}

/**
 * Formatea un numero con separador de miles.
 *
 * `useGrouping: true` es importante: en es-ES el valor por defecto de CLDR es
 * "no agrupar" los numeros de cuatro cifras (2130 en lugar de 2.130), una
 * convencion tipografica correcta pero que despista en un contador de horas.
 * Segun la especificacion, `true` se normaliza a "always": siempre agrupa.
 */
export function formatNumber(value: number, lang: Language): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', {
    useGrouping: true,
    maximumFractionDigits: 2,
  }).format(value)
}

/** "1.250 h" / "1,250 h". Devuelve `null` si no hay horas. */
export function formatHours(hours: number, lang: Language, unit = 'h'): string | null {
  if (!Number.isFinite(hours) || hours <= 0) return null
  return `${formatNumber(hours, lang)} ${unit}`
}