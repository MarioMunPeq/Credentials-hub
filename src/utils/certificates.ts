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
  /** Diametro del nodo en px. */
  size: number
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
  /** Horas maximas, para normalizar el diametro de los nodos. */
  maxHours: number
}

/** Diametro minimo y maximo de un nodo. */
const NODE_MIN = 10
const NODE_MAX = 40

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
 * de los elementos. El diametro de cada nodo es proporcional a la raíz
 * cuadrada de las horas: la Perception del área es fiel a la del valor, mientras
 * que un diámetro proporcional infravalora las diferencias grandes.
 */
export function buildTrajectory(
  certificates: ProcessedCertificate[],
  language: Language,
  width: number,
): TrajectoryScale {
  if (certificates.length === 0) {
    return { from: 0, to: 1, width, years: [], yearMarks: [], points: [], maxHours: 0 }
  }

  const years = certificates.map((c) => c.dateParts.year ?? 1970)
  const firstYear = Math.min(...years)
  const lastYear = Math.max(...years)

  // Se añade un año de margen a cada lado para que los nodos extremos no
  // queden pegados al borde y su etiqueta no se recorte.
  const from = Date.UTC(firstYear, 0, 1)
  const to = Date.UTC(lastYear, 11, 31)

  const sorted = sortByDateDesc(certificates, language).slice().sort((a, b) => a.sortKey - b.sortKey)
  const maxHours = Math.max(0, ...certificates.map((c) => c.hours))

  const points: TrajectoryPoint[] = sorted.map((certificate) => {
    const time = certificateTime(certificate)
    const { hours } = certificate

    const size =
      hours > 0
        ? NODE_MIN + (NODE_MAX - NODE_MIN) * Math.sqrt(hours / maxHours)
        : NODE_MIN

    return {
      certificate,
      display: toDisplay(certificate, language),
      time,
      left: ratioOf(time, from, to),
      // Se redondea a 0.1 para que el estilo en linea quede limpio.
      size: Math.round(size * 10) / 10,
    }
  })

  const yearMarks: { year: number; left: number }[] = []
  for (let year = firstYear; year <= lastYear; year += 1) {
    yearMarks.push({ year, left: ratioOf(Date.UTC(year, 0, 1), from, to) })
  }

  return { from, to, width, years: yearMarks.map((mark) => mark.year), yearMarks, points, maxHours }
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

/** Rejilla de carriles para colocar las etiquetas sin solaparse. */
export interface LabelPlacement {
  id: string
  /** Porcentaje horizontal del centro de la etiqueta. */
  left: number
  /** Carril asignado: 0 y 2 arriba, 1 y 3 abajo. */
  lane: number
  /** px de desplazamiento vertical desde el eje. */
  offset: number
  /** Ancho estimado de la etiqueta, en px. */
  width: number
  /** `false` si no cabe en ningun carril visible. */
  visible: boolean
}

/** Numero de carriles: dos por encima del eje y dos por debajo. */
const LANES = 4

/** Separacion minima entre etiquetas del mismo carril, en px. */
const LABEL_GAP = 10

/** Ancho aproximado de un caracter en la mono de 12px. */
const CHAR_WIDTH = 7.3

/**
 * Coloca las etiquetas en carriles verticales para que ninguna se solape.
 *
 * Recorre los puntos en orden cronologico y va metiendo cada etiqueta en el
 * primer carril libre, con preferencia por el lado alterno (arriba, abajo) para
 * repartir. Se mide en pixeles reales del eje, no en porcentaje, porque dos
 * puntos muy juntos en porcentaje pueden quedar muy lejos o muy cerca segun el
 * ancho de la pantalla.
 */
export function placeLabels(
  points: TrajectoryPoint[],
  trackWidth: number,
  options: { laneHeight: number; axisOffset: number },
): Map<string, LabelPlacement> {
  const { laneHeight, axisOffset } = options
  const placements = new Map<string, LabelPlacement>()
  if (trackWidth <= 0) return placements

  // Ultimo borde derecho ocupado por carril.
  const laneEnd: number[] = new Array(LANES).fill(Number.NEGATIVE_INFINITY)

  for (const [position, point] of points.entries()) {
    const width = Math.min(
      trackWidth,
      point.display.short.length * CHAR_WIDTH + 20,
    )
    const center = (point.left / 100) * trackWidth
    let left = center - width / 2
    // Se recorta contra los bordes del eje, no del viewport: el contenedor
    // tiene scroll horizontal, asi que un poco de recorte es aceptable.
    left = Math.max(0, Math.min(trackWidth - width, left))
    const right = left + width

    // Se prueba primero el lado alterno y despues los demas carriles.
    const preferred = position % 2 === 0 ? [0, 2, 1, 3] : [1, 3, 0, 2]

    let chosen = -1
    for (const lane of preferred) {
      // Un carril libre vale -Infinity, asi que la primera etiqueta siempre
      // cabe. El criterio es que la nueva NO solape con la anterior del carril,
      // de ahi que se compare el borde izquierdo contra el derecho ya ocupado.
      const occupied = laneEnd[lane] ?? Number.NEGATIVE_INFINITY
      if (left >= occupied + LABEL_GAP) {
        chosen = lane
        break
      }
    }

    if (chosen === -1) {
      // Ningun carril libre: la etiqueta se oculta y queda solo en el tooltip.
      placements.set(point.certificate.id, {
        id: point.certificate.id,
        left,
        lane: 0,
        offset: -axisOffset,
        width,
        visible: false,
      })
      continue
    }

    laneEnd[chosen] = right
    const above = chosen < 2
    const depth = chosen % 2

    placements.set(point.certificate.id, {
      id: point.certificate.id,
      left,
      lane: chosen,
      offset: (above ? -1 : 1) * (axisOffset + depth * laneHeight),
      width,
      visible: true,
    })
  }

  return placements
}

/** Separacion vertical desde el eje hasta la primera etiqueta, en px. */
export const AXIS_LABEL_OFFSET = 26

/** Alto de un carril de etiquetas, en px. */
export const LANE_HEIGHT = 46

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
