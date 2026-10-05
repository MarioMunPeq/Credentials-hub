import type { Language } from '../i18n/translations'
import { translations } from '../i18n/translations'
import type { DisplayCertificate, ProcessedCertificate } from '../types/certificate'
import { formatDateParts, formatHours } from './dates'

/**
 * Secciones en el orden en que aparecen. La clave es la `category` del JSON, de
 * modo que anadir un certificado no obliga a tocar nada.
 *
 * La Trayectoria es la seccion 01 y no viene de aqui: se antepone en la
 * navegacion, y por eso estas empiezan a numerarse desde la 02.
 */
export const SECTION_ORDER = ['estudios', 'ia', 'idiomas', 'prl', 'tecnologia'] as const

/** Titulo traducido de una seccion. */
export function sectionTitle(category: string, language: Language): string {
  const known = translations[language].sections as Record<string, string | undefined>
  return known[category] ?? category
}

/** Identificador de ancla estable, para la navegacion y el scrollspy. */
export function sectionId(category: string): string {
  return `section-${category}`
}

/** Ancla del indice de credenciales, que ocupa la seccion 01. */
export const TRAJECTORY_ID = 'trajectory'

/** Una seccion ya preparada para pintar. */
export interface CertificateSection {
  category: string
  /** Numero de indice visible: "02", "03"… La Trayectoria ocupa la 01. */
  number: string
  title: string
  id: string
  items: DisplayCertificate[]
  /** Horas maximas de la seccion, para normalizar las barras. */
  maxHours: number
}

/** Numero de indice a dos digitos. */
export function indexLabel(value: number): string {
  return String(value).padStart(2, '0')
}

/** Etiqueta de fecha ya traducida. */
export function certificateDateLabel(
  certificate: ProcessedCertificate,
  language: Language,
): string {
  return formatDateParts(certificate.dateParts, language)
}

/** "1.250 h" / "1,250 h", o `null` si el certificado no declara horas. */
export function certificateHoursLabel(
  certificate: ProcessedCertificate,
  language: Language,
): string | null {
  return formatHours(certificate.hours, language)
}

/** Caracteres maximos de una etiqueta corta antes de recortar con elipsis. */
const SHORT_LIMIT = 28

/**
 * Version corta del titulo para las etiquetas de la trayectoria.
 *
 * Usa `shortTitle` del JSON cuando existe. Si no, recorta el titulo a ~28
 * caracteres, prefiriendo cortar por palabra para no partir "Desarrollo" en
 * "Desarr".
 */
export function shortTitle(
  title: string,
  declared: { es: string; en: string } | null,
  language: Language,
): string {
  if (declared) return declared[language]

  if (title.length <= SHORT_LIMIT) return title

  const cut = title.slice(0, SHORT_LIMIT)
  const lastSpace = cut.lastIndexOf(' ')
  const stem = lastSpace > SHORT_LIMIT * 0.6 ? cut.slice(0, lastSpace) : cut

  return `${stem.trimEnd()}…`
}

/** Anade a cada certificado sus textos ya resueltos en el idioma activo. */
export function toDisplay(
  certificate: ProcessedCertificate,
  language: Language,
): DisplayCertificate {
  return {
    certificate,
    short: shortTitle(certificate.title, certificate.shortTitle, language),
    dateLabel: certificateDateLabel(certificate, language),
    hoursLabel: certificateHoursLabel(certificate, language),
  }
}

/**
 * Ordena por fecha y, a igualdad de fecha, por titulo para que el resultado
 * sea estable entre recargas. La copia evita mutar el array original.
 */
export function sortByDateDesc(
  certificates: ProcessedCertificate[],
  language: Language,
): ProcessedCertificate[] {
  return [...certificates].sort((a, b) => {
    if (a.sortKey !== b.sortKey) return b.sortKey - a.sortKey
    return a.title.localeCompare(b.title, language === 'es' ? 'es' : 'en', { sensitivity: 'base' })
  })
}

/**
 * Reparte los certificados en secciones numeradas, en el orden de
 * `SECTION_ORDER`, y descarta las que se quedan vacias.
 *
 * Descartarlas es lo que permite que una busqueda sin resultados oculte la
 * seccion entera en lugar de dejar un titulo huerfano sobre una rejilla vacia.
 */
export function buildSections(
  certificates: ProcessedCertificate[],
  language: Language,
): CertificateSection[] {
  const byCategory = new Map<string, ProcessedCertificate[]>()
  for (const certificate of certificates) {
    const bucket = byCategory.get(certificate.category)
    if (bucket) bucket.push(certificate)
    else byCategory.set(certificate.category, [certificate])
  }

  const ordered: string[] = [
    ...SECTION_ORDER,
    // Cualquier categoria nueva aparece al final, por orden alfabetico.
    ...[...byCategory.keys()]
      .filter((category) => !(SECTION_ORDER as readonly string[]).includes(category))
      .sort((a, b) => a.localeCompare(b, 'es')),
  ]

  return ordered
    .filter((category) => byCategory.has(category))
    .map((category, position) => {
      const items = sortByDateDesc(byCategory.get(category) ?? [], language).map((certificate) =>
        toDisplay(certificate, language),
      )

      return {
        category,
        // La Trayectoria es la 01, asi que las secciones empiezan en la 02.
        number: indexLabel(position + 2),
        title: sectionTitle(category, language),
        id: sectionId(category),
        items,
        maxHours: Math.max(0, ...items.map((item) => item.certificate.hours)),
      }
    })
}

/** Un elemento ya situado en la linea de tiempo. */
export function hoursBarWidth(hours: number, maxHours: number): number {
  if (hours <= 0 || maxHours <= 0) return 0
  return Math.max(3, Math.sqrt(hours / maxHours) * 100)
}

/**
 * Fecha de la certificacion más reciente, en formato largo y en el idioma
 * activo. Se usa en el pie ("Actualizado: …").
 */
export function latestCertificateDate(certificates: ProcessedCertificate[]): Date | null {
  let latest: Date | null = null

  for (const certificate of certificates) {
    const { year, month, day } = certificate.dateParts
    if (year === null) continue
    const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1))
    if (!latest || date > latest) latest = date
  }

  return latest
}

/** Formatea una fecha larga en el idioma activo ("16 de noviembre de 2018"). */
export function formatLongDate(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}