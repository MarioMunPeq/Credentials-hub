import type { Language } from '../i18n/translations'
import type { ProcessedCertificate, SortOrder } from '../types/certificate'
import { categoryLabel, CATEGORY_ORDER, type KnownCategory } from './categories'
import { formatDateParts, formatHours } from './dates'

/** Facetas activas del buscador. Todas vacias significa "sin filtros". */
export interface Filters {
  query: string
  categories: string[]
  tags: string[]
}

export const EMPTY_FILTERS: Filters = { query: '', categories: [], tags: [] }

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

/**
 * Normaliza texto para la busqueda: sin mayusculas, sin acentos y sin signos.
 * Asi "redes neuronales" encuentra "Redes Neuronales" y "python" encuentra
 * "Python", independientemente del idioma de la interfaz.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Texto sobre el que actua el buscador: titulo, entidad, categoria y etiquetas. */
function searchableText(certificate: ProcessedCertificate, language: Language): string {
  return normalizeSearchText(
    [
      certificate.title,
      certificate.issuer,
      categoryLabel(certificate.category, language),
      ...certificate.tags,
    ].join(' '),
  )
}

export function hasActiveFilters(filters: Filters): boolean {
  return filters.query.trim().length > 0 || filters.categories.length > 0 || filters.tags.length > 0
}

/**
 * Aplica buscador, categorias y etiquetas.
 *
 * - Cada palabra de la busqueda debe aparecer (AND), en cualquier campo.
 * - Varias palabras clave se combinan con OR.
 * - Las facetas se combinan con AND entre si.
 */
export function filterCertificates(
  certificates: ProcessedCertificate[],
  filters: Filters,
  language: Language,
): ProcessedCertificate[] {
  const terms = normalizeSearchText(filters.query).split(/\s+/).filter(Boolean)

  return certificates.filter((certificate) => {
    if (filters.categories.length > 0 && !filters.categories.includes(certificate.category)) {
      return false
    }
    if (filters.tags.length > 0 && !filters.tags.some((tag) => certificate.tags.includes(tag))) {
      return false
    }
    if (terms.length === 0) return true

    const haystack = searchableText(certificate, language)
    return terms.every((term) => haystack.includes(term))
  })
}

/**
 * Ordena por fecha y, a igualdad de fecha, por titulo para que el resultado
 * sea estable entre recargas. La copia evita mutar el array original.
 */
export function sortCertificates(
  certificates: ProcessedCertificate[],
  order: SortOrder,
  language: Language,
): ProcessedCertificate[] {
  const direction = order === 'asc' ? 1 : -1

  return [...certificates].sort((a, b) => {
    if (a.sortKey !== b.sortKey) return (a.sortKey - b.sortKey) * direction
    return a.title.localeCompare(b.title, language === 'es' ? 'es' : 'en', { sensitivity: 'base' })
  })
}

/**
 * Cuenta los certificados por categoria.
 *
 * El orden es el de `CATEGORY_ORDER` (estudios, tecnologia, idiomas, prl, ia)
 * para que los filtros se lean siempre igual. Las categorias nuevas que no
 * esten en esa lista van al final, por orden alfabetico.
 */
export function countByCategory(certificates: ProcessedCertificate[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const certificate of certificates) {
    counts.set(certificate.category, (counts.get(certificate.category) ?? 0) + 1)
  }

  return [...counts.entries()].sort(([a], [b]) => {
    const indexA = CATEGORY_ORDER.indexOf(a as KnownCategory)
    const indexB = CATEGORY_ORDER.indexOf(b as KnownCategory)
    const knownA = indexA === -1
    const knownB = indexB === -1

    if (knownA && knownB) return a.localeCompare(b, 'es')
    if (knownA) return 1
    if (knownB) return -1
    return indexA - indexB
  })
}

/** Todas las etiquetas distintas, ordenadas alfabeticamente. */
export function collectTags(certificates: ProcessedCertificate[]): string[] {
  const tags = new Set<string>()
  for (const certificate of certificates) {
    for (const tag of certificate.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'es'))
}

/** Agrupa la linea de tiempo por año, de mas reciente a mas antiguo. */
export function groupByYear(certificates: ProcessedCertificate[]): {
  year: number | null
  items: ProcessedCertificate[]
}[] {
  const groups = new Map<number | null, ProcessedCertificate[]>()

  for (const certificate of certificates) {
    const year = certificate.dateParts.year
    const bucket = groups.get(year)
    if (bucket) bucket.push(certificate)
    else groups.set(year, [certificate])
  }

  return [...groups.entries()]
    .sort(([a], [b]) => (b ?? 0) - (a ?? 0))
    .map(([year, items]) => ({ year, items }))
}

/** Suma de horas de un conjunto de certificados. */
export function sumHours(certificates: ProcessedCertificate[]): number {
  return certificates.reduce((acc, certificate) => acc + certificate.hours, 0)
}

/**
 * Total de horas formateado para los contadores resumen. Devuelve `null` si la
 * suma es cero, para que la interfaz pueda ocultar el dato en lugar de
 * mostrar un "0 h" sin sentido.
 */
export function formatTotalHours(
  certificates: ProcessedCertificate[],
  language: Language,
): string | null {
  return formatHours(sumHours(certificates), language)
}