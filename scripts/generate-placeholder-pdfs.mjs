#!/usr/bin/env node
/**
 * Genera un PDF de ejemplo por cada entrada de public/data/certificates.json.
 *
 * Sirve para que el sitio funcione desde el primer momento sin subir
 * documentos reales. Los PDF generados llevan la marca "DOCUMENTO DE EJEMPLO"
 * para que no se confundan con un certificado autentico.
 *
 * Uso:
 *   node scripts/generate-placeholder-pdfs.mjs           # solo los que faltan
 *   node scripts/generate-placeholder-pdfs.mjs --force   # regenera todos
 *
 * IMPORTANTE: al subir certificados reales, este script NO se usa. Coloca el
 * PDF en public/certs/<categoria>/ y anade la entrada en certificates.json
 * consultando el README.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const certificatesPath = join(projectRoot, 'public', 'data', 'certificates.json')
const force = process.argv.includes('--force')

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 56

/**
 * Helvetica usa WinAnsiEncoding: los bytes de 0x80 a 0xFF significan
 * caracteres acentuados. Transliterar a ASCII es mas simple y evita
 * problemas de codificacion al escribir el fichero.
 */
function toAscii(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00a0/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
}

/** Escapa los caracteres especiales de una cadena literal de PDF. */
function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

/** Reparte el texto en lineas que caben en el ancho disponible. */
function wrap(text, fontSize, maxWidth) {
  const charWidth = fontSize * 0.52
  const maxChars = Math.max(8, Math.floor(maxWidth / charWidth))
  const words = text.split(/\s+/).filter(Boolean)

  const lines = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines.length > 0 ? lines : ['']
}

class PageBuilder {
  constructor() {
    this.operations = []
    // Se reserva una banda superior para el aviso de documento de ejemplo; el
    // contenido empieza por debajo, de modo que nada se solape.
    this.bandHeight = 64
    this.y = PAGE_HEIGHT - MARGIN - this.bandHeight - 28
  }

  /** Banda superior a todo el ancho con el aviso de ejemplo. */
  headerBand(text) {
    const top = PAGE_HEIGHT
    this.operations.push(
      `0.93 0.94 0.95 rg 0 0 ${PAGE_WIDTH} ${this.bandHeight} re f`,
      `0.75 0.78 0.81 RG 0.8 w 0 ${top - this.bandHeight} m ${PAGE_WIDTH} ${top - this.bandHeight} l S`,
      `BT /F2 12 Tf 0.36 0.39 0.43 rg 1 0 0 1 ${MARGIN} ${(top - this.bandHeight / 2 - 4).toFixed(2)} Tm (${escapePdfText(toAscii(text))}) Tj ET`,
    )
    return this
  }

  text(value, { font = 'F1', size = 11, x = MARGIN, color = '0 0 0', gap = 6 } = {}) {
    const lines = wrap(toAscii(value), size, PAGE_WIDTH - MARGIN * 2)
    for (const line of lines) {
      this.y -= size
      this.operations.push(
        `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${this.y.toFixed(2)} Tm (${escapePdfText(line)}) Tj ET`,
      )
      this.y -= gap
    }
    return this
  }

  paragraph(value, options = {}) {
    return this.text(value, { size: 13, font: 'F2', gap: 10, ...options })
  }

  heading(value, options = {}) {
    this.y -= 10
    return this.text(value, { size: 9, font: 'F2', color: '0.42 0.45 0.5', gap: 12, ...options })
  }

  rule() {
    this.y -= 6
    this.operations.push(
      `0.78 0.8 0.84 RG 0.7 w ${MARGIN} ${this.y.toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`,
    )
    this.y -= 14
    return this
  }

  gap(amount = 12) {
    this.y -= amount
    return this
  }

  /** Banda de fondo desde la posicion actual hacia abajo. */
  box(height, { fill = '0.96 0.965 0.975' } = {}) {
    this.operations.push(
      `${fill} rg ${MARGIN} ${(this.y - height).toFixed(2)} ${(PAGE_WIDTH - MARGIN * 2).toFixed(2)} ${height.toFixed(2)} re f`,
    )
    return this
  }

  /** Etiqueta pequena en versalitas. */
  badge(text, y) {
    const label = toAscii(text).toUpperCase()
    const width = label.length * 5.4 + 18
    this.operations.push(
      `0.11 0.24 0.42 rg ${MARGIN} ${y.toFixed(2)} ${width.toFixed(2)} 15 re f`,
      `BT /F2 7.5 Tf 1 1 1 rg 1 0 0 1 ${(MARGIN + 9).toFixed(2)} ${(y + 5).toFixed(2)} Tm (${escapePdfText(label)}) Tj ET`,
    )
    return this
  }

  get content() {
    return this.operations.join('\n')
  }
}

/**
 * Ensambla un PDF 1.4 valido de una sola pagina.
 *
 * Las referencias cruzadas (`xref`) necesitan el offset en BYTES de cada
 * objeto, por eso el contenido se escribe con codificacion latin1 y se mide
 * con Buffer.byteLength, no con String.length.
 */
function buildPdf(contentStream) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      '/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(contentStream, 'latin1')} >>\nstream\n${contentStream}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets = []

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'))
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, 'latin1')
}

const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function formatDate(raw) {
  const match = /^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(String(raw ?? '').trim())
  if (!match) return 'Fecha no indicada'

  const year = match[1]
  const month = match[2] ? MONTHS_ES[Number(match[2]) - 1] : null
  const day = match[3] ? Number(match[3]) : null

  if (day && month) return `${day} de ${month} de ${year}`
  if (month) return `${month} de ${year}`
  return year
}

function formatHours(hours) {
  if (hours === null || hours === undefined || Number(hours) === 0) return 'No indicadas'
  return `${Number(hours).toLocaleString('es-ES').replace('.', ',')} horas`
}

function renderCertificate(certificate) {
  const page = new PageBuilder()

  // Los textos van sin acentos a proposito: `toAscii` los normaliza antes de
  // escribirlos, asi el PDF es valido con la fuente base Helvetica.
  page.headerBand('DOCUMENTO DE EJEMPLO - NO ES UN CERTIFICADO AUTÉNTICO')
  page.badge('Credenciales Hub', page.y + 2)

  page.gap(26)
  page.text('CERTIFICADO DE REFERENCIA', { font: 'F2', size: 10, color: '0.42 0.45 0.5', gap: 16 })
  page.text(certificate.title ?? 'Título sin indicar', { font: 'F2', size: 22, gap: 14 })
  page.rule()

  const issuerLabel = 'Entidad emisora'
  const dateLabel = 'Fecha de emisión'
  const hoursLabel = 'Duración'
  const idLabel = 'Identificador'
  const categoryLabel = 'Categoría'

  page.heading(issuerLabel)
  page.text(certificate.issuer ?? 'No indicada', { size: 14, font: 'F2', gap: 16 })

  page.heading(dateLabel)
  page.text(formatDate(certificate.date), { size: 13, gap: 14 })

  page.heading(hoursLabel)
  page.text(formatHours(certificate.hours), { size: 13, gap: 14 })

  page.heading(categoryLabel)
  page.text(certificate.category ?? 'No indicada', { size: 13, gap: 14 })

  page.heading(idLabel)
  page.text(certificate.id ?? 'sin id', { size: 13, gap: 14 })

  if (Array.isArray(certificate.tags) && certificate.tags.length > 0) {
    page.heading('Etiquetas')
    page.text(certificate.tags.join(' · '), { size: 12, color: '0.32 0.34 0.38', gap: 14 })
  }

  page.gap(28)
  const notice = [
    'Este fichero es un PDF de ejemplo generado automáticamente para probar el sitio.',
    'Sustitúyelo por el documento real antes de publicar.',
  ].join(' ')
  // La banda se pinta desde la posición actual hacia abajo; el texto entra
  // dentro tras retroceder un pequeño margen.
  page.box(58)
  page.gap(10)
  page.paragraph(notice, { size: 10, gap: 12 })

  page.gap(10)
  page.text(
    'Antes de subir documentos reales, tapa la información personal (DNI, NIE, número de registro, dirección, firma, códigos de acceso) con una herramienta de redacción real. Consulta el README.',
    { size: 9, color: '0.42 0.45 0.5', gap: 10 },
  )

  return buildPdf(page.content)
}

async function main() {
  let certificates
  try {
    certificates = JSON.parse(await readFile(certificatesPath, 'utf8'))
  } catch (error) {
    console.error(
      `No se pudo leer ${certificatesPath}. Comprueba que el JSON sea valido.`,
      error,
    )
    process.exitCode = 1
    return
  }

  if (!Array.isArray(certificates)) {
    console.error(`${certificatesPath} debe contener una lista de certificados.`)
    process.exitCode = 1
    return
  }

  let created = 0
  let skipped = 0

  for (const certificate of certificates) {
    const relative = certificate.pdf
    if (typeof relative !== 'string' || relative.length === 0) {
      console.warn(`  ! ${certificate.id ?? '(sin id)'}: sin campo "pdf", se omite.`)
      continue
    }

    const target = join(projectRoot, 'public', relative.replace(/^\/+/, ''))

    if (existsSync(target) && !force) {
      skipped += 1
      continue
    }

    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, renderCertificate(certificate))
    console.log(`  + ${relative}`)
    created += 1
  }

  console.log(
    `\n${created} PDF generado(s), ${skipped} sin tocar (ya existian).${
      force ? ' Se han sobrescrito todos por --force.' : ''
    }`,
  )
}

await main()