/**
 * Comprobacion de la geometria de la trayectoria con los datos reales.
 * Es logica pura, asi que se puede ejecutar con Node sin navegador.
 *   node scripts/check-trajectory.mjs
 */

import { readFile } from 'node:fs/promises'

const raw = JSON.parse(await readFile('public/data/certificates.json', 'utf8'))

// --- Replica de las utilidades, para poder ejecutarlas sin compilar TS --------
const NODE_MIN = 10
const NODE_MAX = 40
const LANES = 4
const LABEL_GAP = 10
const CHAR_WIDTH = 7.3
const AXIS_LABEL_OFFSET = 26
const LANE_HEIGHT = 46
const LABEL_HEIGHT = 38
const YEAR_HEIGHT = 30
const MIN_AXIS_BAND = 96

const MONTHS = { es: ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] }

function timeOf(entry) {
  const [y, m = '1', d = '1'] = entry.date.split('-')
  return Date.UTC(Number(y), Number(m) - 1, Number(d))
}

const certs = raw
  .map((c) => ({ ...c, time: timeOf(c), hours: Number(c.hours) || 0 }))
  .sort((a, b) => a.time - b.time)

const years = certs.map((c) => new Date(c.time).getUTCFullYear())
const firstYear = Math.min(...years)
const lastYear = Math.max(...years)
const from = Date.UTC(firstYear, 0, 1)
const to = Date.UTC(lastYear, 11, 31)
const maxHours = Math.max(...certs.map((c) => c.hours))

const ratio = (t) => Math.min(100, Math.max(0, ((t - from) / (to - from)) * 100))

console.log(`Dominio: 1 ene ${firstYear} -> 31 dic ${lastYear}`)
console.log(`Horas maximas: ${maxHours}\n`)

const points = certs.map((c) => {
  const size = c.hours > 0 ? NODE_MIN + (NODE_MAX - NODE_MIN) * Math.sqrt(c.hours / maxHours) : NODE_MIN
  return { id: c.id, short: c.shortTitle?.es ?? c.title, left: ratio(c.time), size, time: c.time }
})

console.log('NODOS')
for (const p of points) {
  const d = new Date(p.time)
  console.log(
    `  ${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` +
      `  left=${p.left.toFixed(1).padStart(5)}%  d=${p.size.toFixed(1).padStart(4)}px  "${p.short}"`,
  )
}

// --- Colisiones de etiquetas a varias anchuras -------------------------------
for (const trackWidth of [900, 1200, 1600, 2000, 2400]) {
  const laneEnd = new Array(LANES).fill(Number.NEGATIVE_INFINITY)
  const placed = []
  let hidden = 0

  points.forEach((point, position) => {
    const width = Math.min(trackWidth, point.short.length * CHAR_WIDTH + 20)
    const center = (point.left / 100) * trackWidth
    let left = Math.max(0, Math.min(trackWidth - width, center - width / 2))
    const right = left + width

    const preferred = position % 2 === 0 ? [0, 2, 1, 3] : [1, 3, 0, 2]
    let chosen = -1
    for (const lane of preferred) {
      const occupied = laneEnd[lane] ?? Number.NEGATIVE_INFINITY
      if (left >= occupied + LABEL_GAP) { chosen = lane; break }
    }

    if (chosen === -1) { hidden += 1; return }
    laneEnd[chosen] = right
    placed.push({ id: point.id, lane: chosen, left, right })
  })

  // Comprobacion de solapamientos reales entre etiquetas visibles
  let overlaps = 0
  for (let i = 0; i < placed.length; i += 1) {
    for (let j = i + 1; j < placed.length; j += 1) {
      const a = placed[i], b = placed[j]
      if (a.lane !== b.lane) continue
      if (a.left < b.right && b.left < a.right) overlaps += 1
    }
  }

  const usedLanes = [...new Set(placed.map((p) => p.lane))].sort()
  let above = 0, below = 0
  for (const p of placed) {
    const offset = (p.lane < 2 ? -1 : 1) * (AXIS_LABEL_OFFSET + (p.lane % 2) * LANE_HEIGHT)
    const need = Math.abs(offset) + LABEL_HEIGHT
    if (offset < 0) above = Math.max(above, need); else below = Math.max(below, need)
  }
  const axisTop = Math.max(MIN_AXIS_BAND, above)
  const axisHeight = axisTop + Math.max(YEAR_HEIGHT, below)
  const total = 62 + axisHeight // cabecera de seccion aproximada

  console.log(
    `  ${String(trackWidth).padStart(4)}px  carriles=[${usedLanes.join(',')}]  ` +
      `ocultas=${hidden}  solapes=${overlaps}  eje=${axisHeight}px  total≈${total}px`,
  )
}

// --- Deteccion de proximidad: los dos PRL de 2026 ---------------------------
const sep = points.find((p) => p.id.includes('health'))
const sep2 = points.find((p) => p.id === 'prl-consultant')
if (sep && sep2) {
  const gapPct = Math.abs(sep.left - sep2.left)
  const gapPx = (gapPct / 100) * 2400
  console.log(`\nPRL 2026: separados ${gapPct.toFixed(2)}% = ${gapPx.toFixed(0)}px a 2400px de eje`)
  console.log(`  ancho estimado de etiqueta ≈ ${(sep2.short.length * CHAR_WIDTH + 20).toFixed(0)}px`)
  console.log(`  ${gapPx < sep2.short.length * CHAR_WIDTH + 20 ? 'COLISIONAN: requieren carriles distintos' : 'caben en el mismo carril'}`)
}

console.log(`\nMeses disponibles en las traducciones: ${Object.keys(MONTHS.es).length}`)
