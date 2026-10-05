/**
 * Comprobacion de la geometria de la trayectoria con los datos reales.
 * Es logica pura, asi que se puede ejecutar con Node sin navegador.
 *   node scripts/check-trajectory.mjs
 *
 * La trayectoria ya no reparte etiquetas en carriles: solo hay un eje con anos y
 * puntos, y toda la informacion vive en una ficha de detalle. Lo que queda por
 * verificar es que los puntos no se solapen y que ninguno se salga del eje.
 */

import { readFile } from 'node:fs/promises'

const raw = JSON.parse(await readFile('public/data/certificates.json', 'utf8'))

// --- Replica de las utilidades, para poder ejecutarlas sin compilar TS --------
const DOT_SIZE = 11
const DOT_GAP = 16

const MONTHS = { es: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] }

function timeOf(entry) {
  const [y, m = '1', d = '1'] = entry.date.split('-')
  return Date.UTC(Number(y), Number(m) - 1, Number(d))
}

/** Misma relajacion que `placeDots`: dos pasadas, una por sentido. */
function placeDots(points, trackWidth) {
  const half = DOT_SIZE / 2
  const limit = trackWidth - half
  // La posicion real depende del ancho que se este probando, asi que se calcula
  // aqui y no en la definicion del punto: fijarla a un ancho daria un
  // desplazamiento falso en todos los demas.
  const trueLefts = points.map((p) => (p.left / 100) * trackWidth)
  const lefts = [...trueLefts]

  for (let i = 1; i < lefts.length; i += 1) {
    lefts[i] = Math.max(lefts[i], lefts[i - 1] + DOT_GAP)
  }
  for (let i = lefts.length - 1; i >= 0; i -= 1) {
    let value = Math.min(lefts[i], limit)
    if (i < lefts.length - 1) value = Math.min(value, lefts[i + 1] - DOT_GAP)
    lefts[i] = value
  }

  return lefts.map((left, i) => ({
    left: Math.max(half, left),
    shift: Math.max(half, left) - trueLefts[i],
  }))
}

const certs = raw
  .map((c) => ({ ...c, time: timeOf(c), hours: Number(c.hours) || 0 }))
  .sort((a, b) => a.time - b.time)

const years = certs.map((c) => new Date(c.time).getUTCFullYear())
const firstYear = Math.min(...years)
const lastYear = Math.max(...years)
const from = Date.UTC(firstYear, 0, 1)
const to = Date.UTC(lastYear, 11, 31)
const totalHours = certs.reduce((sum, c) => sum + c.hours, 0)
const maxHours = Math.max(...certs.map((c) => c.hours))

const ratio = (t) => Math.min(100, Math.max(0, ((t - from) / (to - from)) * 100))

console.log(`Dominio: 1 ene ${firstYear} -> 31 dic ${lastYear}`)
console.log(`Certificados: ${certs.length}   Horas: ${totalHours} (max ${maxHours})\n`)

const points = certs.map((c) => ({
  id: c.id,
  short: c.shortTitle?.es ?? c.title,
  left: ratio(c.time),
  hours: c.hours,
  time: c.time,
}))

console.log('PUNTOS')
for (const p of points) {
  const d = new Date(p.time)
  console.log(
    `  ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` +
      `  left=${p.left.toFixed(1).padStart(5)}%  ${String(p.hours).padStart(3)} h  "${p.short}"`,
  )
}

// --- Colisiones de puntos a varias anchuras -----------------------------------
let failed = false

for (const trackWidth of [900, 1200, 1600, 2000, 2400]) {
  const placed = placeDots(points, trackWidth)
  const scaled = points.map((p, i) => ({ ...p, ...placed[i] }))

  let overlaps = 0
  for (let i = 1; i < scaled.length; i += 1) {
    const gap = scaled[i].left - scaled[i - 1].left
    if (gap < DOT_GAP - 0.01) overlaps += 1
  }

  const half = DOT_SIZE / 2
  const outside = scaled.filter((p) => p.left < half - 0.01 || p.left > trackWidth - half + 0.01)
  const shifted = scaled.filter((p) => p.shift > 0.5)
  const worst = Math.max(0, ...shifted.map((p) => p.shift))

  if (overlaps > 0 || outside.length > 0) failed = true

  console.log(
    `  ${String(trackWidth).padStart(4)}px  solapes=${overlaps}  fuera=${outside.length}  ` +
      `desplazados=${shifted.length}${shifted.length > 0 ? ` (max ${worst.toFixed(1)}px)` : ''}`,
  )
  for (const p of shifted) {
    console.log(`      guia: "${p.short}" +${p.shift.toFixed(1)}px desde su fecha real`)
  }
}

// --- El alto ya no depende de los datos ---------------------------------------
console.log('\nALTO')
console.log('  banda del eje  = 74px  (fija, var CSS --trajectory-band)')
console.log('  ficha          = 104px (minimo, var CARD_MIN_HEIGHT)')
console.log('  antes: 273-424px segun colisiones de carriles')

// --- Proximidad de los dos PRL de 2026 ---------------------------------------
const sep = points.find((p) => p.id.includes('health'))
const sep2 = points.find((p) => p.id === 'prl-consultant')
if (sep && sep2) {
  const gapPct = Math.abs(sep.left - sep2.left)
  const gapPx = (gapPct / 100) * 2400
  console.log(`\nPRL 2026: separados ${gapPct.toFixed(2)}% = ${gapPx.toFixed(1)}px a 2400px de eje`)
  console.log(
    `  ${gapPx < DOT_GAP
      ? `se desplazan a ${DOT_GAP}px y se dibuja guia de separacion`
      : 'caben sin desplazamiento'}`,
  )
}

console.log(`\nMeses disponibles en las traducciones: ${Object.keys(MONTHS.es).length}`)

if (failed) {
  console.error('\nFALLO: hay puntos solapados o fuera del eje')
  process.exit(1)
}
