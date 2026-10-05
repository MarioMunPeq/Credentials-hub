import type { Certificate, ProcessedCertificate } from '../types/certificate'
import { parseDate, toHours } from '../utils/dates'

/** URL del JSON de datos, respetando el `base` de GitHub Pages. */
export function certificatesUrl(): string {
  return `${import.meta.env.BASE_URL}data/certificates.json`
}

export class CertificatesError extends Error {
  /** `true` cuando el sitio se ha abierto con doble clic desde el disco. */
  readonly isFileProtocol: boolean

  constructor(message: string, isFileProtocol = false) {
    super(message)
    this.name = 'CertificatesError'
    this.isFileProtocol = isFileProtocol
  }
}

/** Convierte cualquier valor a texto recortado, o cadena vacia si no es texto. */
function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

/**
 * Lee y valida `certificates.json`.
 *
 * Los errores de datos NO detienen el sitio: se descartan los registros
 * inservibles y se avisa por consola. Un JSON con un certificado mal formado
 * deberia mostrar los demas, no dejar la pagina en blanco.
 */
export async function loadCertificates(): Promise<ProcessedCertificate[]> {
  const url = certificatesUrl()

  // Abrir dist/index.html con doble clic bloquea fetch() por CORS. Se detecta
  // aqui para poder explicar el problema en vez de mostrar un error generico.
  if (window.location.protocol === 'file:') {
    throw new CertificatesError('Los navegadores bloquean fetch() sobre el protocolo file://.', true)
  }

  let response: Response
  try {
    response = await fetch(url, { cache: 'no-cache' })
  } catch (error) {
    throw new CertificatesError(
      `No se pudo solicitar ${url}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (!response.ok) {
    throw new CertificatesError(
      `${url} respondió ${response.status} ${response.statusText}`,
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    throw new CertificatesError(
      `${url} no contiene JSON válido: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (!Array.isArray(payload)) {
    throw new CertificatesError(`${url} debe contener una lista de certificados.`)
  }

  return processCertificates(payload)
}

/**
 * Normaliza, valida y ordena los certificados leidos del JSON.
 *
 * Exportada por separado para poder comprobarla desde consola o tests.
 */
export function processCertificates(raw: unknown[]): ProcessedCertificate[] {
  const seenIds = new Set<string>()
  const problems: string[] = []
  const processed: ProcessedCertificate[] = []

  raw.forEach((entry, index) => {
    const position = `certificates.json[${index}]`

    if (typeof entry !== 'object' || entry === null) {
      problems.push(`${position}: no es un objeto.`)
      return
    }

    const candidate = entry as Partial<Record<keyof Certificate, unknown>>

    const title = asText(candidate.title)
    const issuer = asText(candidate.issuer)
    const category = asText(candidate.category)

    if (!title || !issuer || !category) {
      problems.push(`${position}: faltan campos obligatorios (title, issuer o category).`)
      return
    }

    // El id es opcional: si no existe se genera a partir del indice, de forma
    // que el certificado siga apareciendo en lugar de desaparecer.
    let id = asText(candidate.id)
    if (!id) {
      id = `cert-${String(index + 1).padStart(2, '0')}`
      problems.push(`${position}: sin "id"; se ha generado el id "${id}".`)
    } else if (seenIds.has(id)) {
      const uniqueId = `${id}-${index + 1}`
      problems.push(`${position}: "id" duplicado "${id}"; se usa "${uniqueId}".`)
      id = uniqueId
    }
    seenIds.add(id)

    const date = asText(candidate.date)
    const parsed = parseDate(date, 'es')
    if (!date) {
      problems.push(`${id}: sin "date".`)
    } else if (parsed.year === null) {
      problems.push(`${id}: "date" con formato no reconocido ("${date}").`)
    }

    const tags = Array.isArray(candidate.tags)
      ? Array.from(
          new Set(
            candidate.tags
              .map((tag) => asText(tag).toLowerCase())
              .filter((tag): tag is string => tag.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b, 'es'))
      : []

    const verifyUrl = asText(candidate.verifyUrl)

    // `shortTitle` admite un texto unico o un objeto por idioma. Se normaliza
    // aqui para que el resto del codigo no tenga que distinguir las dos formas.
    let shortTitle: { es: string; en: string } | null = null
    const rawShort = candidate.shortTitle
    if (typeof rawShort === 'string' && rawShort.trim()) {
      const value = rawShort.trim()
      shortTitle = { es: value, en: value }
    } else if (typeof rawShort === 'object' && rawShort !== null) {
      const record = rawShort as Record<string, unknown>
      const es = asText(record.es)
      const en = asText(record.en)
      if (es || en) shortTitle = { es: es || en, en: en || es }
    }

    processed.push({
      id,
      title,
      issuer,
      date,
      dateParts: { year: parsed.year, month: parsed.month, day: parsed.day },
      sortKey: parsed.sortKey,
      hours: toHours(candidate.hours as number | string | null | undefined),
      category,
      tags,
      pdfUrl: resolveAssetUrl(asText(candidate.pdf)),
      verifyUrl: verifyUrl || null,
      shortTitle,
    })
  })

  if (problems.length > 0 && import.meta.env.DEV) {
    console.warn(
      `[credentials-hub] ${problems.length} aviso(s) al leer certificates.json:\n- ${problems.join('\n- ')}`,
    )
  }

  return processed
}

/**
 * Convierte la ruta del JSON en una URL que funcione con el `base` de GitHub
 * Pages. Acepta "certs/x.pdf", "/certs/x.pdf" y "certs\\x.pdf".
 */
export function resolveAssetUrl(path: string): string {
  if (!path) return ''
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path

  const cleaned = path.replace(/^\/+/, '').replace(/\\/g, '/')
  return `${import.meta.env.BASE_URL}${cleaned}`
}