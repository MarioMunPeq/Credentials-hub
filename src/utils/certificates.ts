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

/** Ancla de la Trayectoria. */
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
 * Normaliza texto para el buscador: sin mayusculas, sin acentos y sin signos.
 * Asi "redes neuronales" encuentra "Redes Neuronales" y "python" encuentra
 * "Python", con independencia del idioma de la interfaz.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Texto sobre el que actua el buscador: titulo, entidad y etiquetas.
 *
 * Las etiquetas no se muestran en la interfaz, pero siguen siendo utiles como
 * indice de busqueda: "python" encuentra el bootcamp aunque el titulo no lo
 * mencione.
 *
 * No depende del idioma: los tres campos son datos, no traduccion.
 */
function searchableText(certificate: ProcessedCertificate): string {
  return normalizeSearchText(
    [certificate.title, certificate.issuer, ...certificate.tags].join(' '),
  )
}

/**
 * Filtra por la consulta del buscador.
 *
 * Cada palabra debe aparecer (AND), en cualquier campo. Asi "dam kotlin" acota
 * en lugar de devolver todo lo que mencione uno de los dos.
 */
export function searchCertificates(
  certificates: ProcessedCertificate[],
  query: string,
): ProcessedCertificate[] {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return certificates

  return certificates.filter((certificate) => {
    const haystack = searchableText(certificate)
    return terms.every((term) => haystack.includes(term))
  })
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
export interface TrajectoryPoint {
  certificate: ProcessedCertificate
  display: DisplayCertificate
  /** Timestamp en ms de la fecha, para colocarlo en el eje. */
  time: number
  /** Posicion horizontal en porcentaje del dominio. */
  left: number
}

/** Ancho del eje en pixeles, o fraccion si la caja no se ha medido aun. */
export interface TrajectoryScale {
  /** Extremos del dominio temporal. */
  from: number
  to: number
  /** Ancho total del eje en px. */
  width: number
  /** Anos que aparecen bajo el eje, en orden. */
  years: number[]
  /** Posicion horizontal de cada inicio de año, en porcentaje. */
  yearMarks: { year: number; left: number }[]
  points: TrajectoryPoint[]
  /** Suma de horas de todos los certificados, para la ficha en reposo. */
  totalHours: number
}

/**
 * Diametro de un punto del eje. Fijo a proposito: antes era proporcional a la raiz
 * cuadrada de las horas, y no comunicaba nada. Nadie lee "450 h" en un circulo de
 * 40px, y un unico punto cuatro veces mayor que los demas rompe el ritmo de la
 * fila y parece un error de dibujo. Las horas ahora van escritas en la ficha.
 */
export const DOT_SIZE = 11

/**
 * Separacion minima entre puntos, en px.
 *
 * Los dos PRL de 2026 estan separados por 6 dias, que a 2400px de eje son 4px:
 * dos circulos de 11px superpuestos. Se separan al minimo y se dibuja una guia
 * entre la posicion real y la dibujada, para que el desplazamiento se vea y la
 * escala temporal no mienta.
 */
export const DOT_GAP = 16

/**
 * Posicion de un punto yajusted por la separacion minima.
 */
export interface DotPlacement {
  /** Posicion horizontal en px dentro del eje. */
  left: number
  /** Distancia en px entre lo dibujado y la posicion real por la fecha. */
  shift: number
}

/**
 * Coloca los puntos del eje respetando una separacion minima.
 *
 * Dos pasadas: una de izquierda a derecha que empuja hacia adelante, y otra de
 * derecha a izquierda que recoge lo que se haya salido del borde. Con una sola
 * pasada, el ultimo punto de una pareja muy junta quedaria fuera del eje.
 */
export function placeDots(
  points: TrajectoryPoint[],
  trackWidth: number,
): Map<string, DotPlacement> {
  const placements = new Map<string, DotPlacement>()
  if (trackWidth <= 0) return placements

  const half = DOT_SIZE / 2
  const limit = trackWidth - half
  const lefts = points.map((point) => (point.left / 100) * trackWidth)

  for (let i = 1; i < lefts.length; i += 1) {
    const previous = lefts[i - 1] ?? 0
    lefts[i] = Math.max(lefts[i] ?? 0, previous + DOT_GAP)
  }
  for (let i = lefts.length - 1; i >= 0; i -= 1) {
    const next = lefts[i + 1]
    let value = Math.min(lefts[i] ?? 0, limit)
    if (next !== undefined) value = Math.min(value, next - DOT_GAP)
    lefts[i] = value
  }

  for (const [index, point] of points.entries()) {
    const trueLeft = (point.left / 100) * trackWidth
    const left = Math.max(half, lefts[index] ?? trueLeft)
    placements.set(point.certificate.id, { left, shift: left - trueLeft })
  }

  return placements
}

/** Anchura minima del eje en movil, con scroll horizontal. */
export const TRACK_MIN_WIDTH = 900

/**
 * Timestamp de un certificado.
 *
 * Se construye en UTC a proposito: una fecha de certificado es una etiqueta y
 * no un instante, y parsearla como ISO la desplazaria un dia en zonas
 * horarias negativas.
 */
export function certificateTime(certificate: ProcessedCertificate): number {
  const { year, month, day } = certificate.dateParts
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

/** Posicion de `time` dentro de `[from, to]`, en porcentaje acotado. */
function ratioOf(time: number, from: number, to: number): number {
  if (to <= from) return 0
  const ratio = ((time - from) / (to - from)) * 100
  return Math.min(100, Math.max(0, ratio))
}

/**
 * Prepara la escala temporal de la trayectoria.
 *
 * El dominio va del 1 de enero del año más antiguo al 31 de diciembre del más
 * reciente, de modo que las posiciones respetan el tiempo real y no el orden
 * de los elementos. Todos los puntos tienen el mismo diametro: lo que se
 * dibuja es cuándo ocurrió cada cosa, y las horas van escritas en la ficha.
 */
export function buildTrajectory(
  certificates: ProcessedCertificate[],
  language: Language,
  width: number,
): TrajectoryScale {
  if (certificates.length === 0) {
    return { from: 0, to: 1, width, years: [], yearMarks: [], points: [], totalHours: 0 }
  }

  const years = certificates.map((c) => c.dateParts.year ?? 1970)
  const firstYear = Math.min(...years)
  const lastYear = Math.max(...years)

  // Se añade un año de margen a cada lado para que los nodos extremos no
  // queden pegados al borde y su etiqueta no se recorte.
  const from = Date.UTC(firstYear, 0, 1)
  const to = Date.UTC(lastYear, 11, 31)

  const sorted = sortByDateDesc(certificates, language).slice().sort((a, b) => a.sortKey - b.sortKey)
  const totalHours = certificates.reduce((sum, c) => sum + c.hours, 0)

  const points: TrajectoryPoint[] = sorted.map((certificate) => {
    const time = certificateTime(certificate)

    return {
      certificate,
      display: toDisplay(certificate, language),
      time,
      left: ratioOf(time, from, to),
    }
  })

  const yearMarks: TrajectoryScale['yearMarks'] = []
  for (let year = firstYear; year <= lastYear; year += 1) {
    yearMarks.push({ year, left: ratioOf(Date.UTC(year, 0, 1), from, to) })
  }

  return { from, to, width, years: yearMarks.map((mark) => mark.year), yearMarks, points, totalHours }
}

/**
 * Porcentaje que ocupa la barra de horas de una entrada.
 *
 * También en raíz cuadrada, y con un suelo del 3% para que un certificado de
 * pocas horas siga teniendo una marca legible.
 */
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
    if (certificate.dateParts.year === null) continue
    const date = new Date(certificateTime(certificate))
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
