/**
 * Miniatura flotante de la primera página de un PDF, con pdf.js.
 *
 * Decisiones:
 * - pdf.js entra con `import()` dinámico y solo en el primer hover: son varios
 *   cientos de KB que quien nunca pasa el ratón no debería descargar.
 * - El worker se resuelve con `?url` de Vite para que se copie y sirva como
 *   fichero propio, en lugar del CDN que trae la librería.
 * - La primera página ya renderizada se cachea por URL: el segundo hover sobre
 *   el mismo certificado es instantáneo.
 * - Cualquier fallo se traga. La miniatura es un extra: si no funciona, la
 *   entrada tiene que seguir siendo perfectamente utilizable.
 */

import { useEffect, useRef, useState } from 'react'

/** Ancho de la miniatura en px. La altura sale de la proporción de la página. */
const THUMB_WIDTH = 220

/** Margen de seguridad para que la miniatura no toque el borde del viewport. */
const VIEWPORT_MARGIN = 12

/** Cuánto se espera a un hover antes de intentar nada. */
const HOVER_DELAY = 250

/** Margen para abortar si pdf.js tarda demasiado. */
const RENDER_TIMEOUT = 6000

type PdfjsModule = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfjsModule> | null = null

/** Carga pdf.js una sola vez y configura el worker para Vite. */
function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      // El sufijo `?url` lo resuelve Vite en build: emite el worker como asset
      // en lugar de intentar descargarlo de un CDN.
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })().catch((error: unknown) => {
      // Si falla se limpia la promesa, para no cachear siempre un rechazo.
      pdfjsPromise = null
      throw error
    })
  }
  return pdfjsPromise
}

/** Cache de miniaturas ya renderizadas, por URL de PDF. */
const cache = new Map<string, HTMLCanvasElement>()

/** Rechaza si la promesa no se resuelve dentro de `ms`. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('pdf.js ha tardado demasiado')), ms)
    }),
  ])
}

/**
 * Renderiza la primera página de un PDF en un canvas y la guarda en cache.
 *
 * @returns El canvas cacheado, o `null` si algo falla.
 */
async function renderFirstPage(url: string): Promise<HTMLCanvasElement | null> {
  const cached = cache.get(url)
  if (cached) return cached

  try {
    const pdfjs = await loadPdfjs()
    const loadingTask = pdfjs.getDocument({ url })
    const doc = await withTimeout(loadingTask.promise, RENDER_TIMEOUT)

    try {
      const page = await withTimeout(doc.getPage(1), RENDER_TIMEOUT)

      // Escala para la anchura deseada, corregida por la densidad de píxeles del
      // dispositivo para que no salga borrosa en pantallas HiDPI.
      const density = Math.min(window.devicePixelRatio || 1, 2)
      const natural = page.getViewport({ scale: 1 })
      const viewport = page.getViewport({ scale: (THUMB_WIDTH * density) / natural.width })

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(viewport.width)
      canvas.height = Math.round(viewport.height)

      const context = canvas.getContext('2d')
      if (!context) return null

      // Fondo blanco: los PDF transparentes se verían sobre el color del tema.
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await withTimeout(
        page.render({ canvas, canvasContext: context, viewport }).promise,
        RENDER_TIMEOUT,
      )

      cache.set(url, canvas)
      return canvas
    } finally {
      // Libera los recursos del worker tanto si el render fue bien como si no.
      void loadingTask.destroy()
    }
  } catch {
    // Silencioso a propósito: la miniatura es opcional.
    return null
  }
}

interface PdfThumbnailProps {
  /** URL del PDF. Si está vacía, no se intenta nada. */
  url: string
  /** `true` mientras el puntero está sobre la entrada. */
  active: boolean
  /** Coordenadas del puntero en el viewport, en px. */
  pointerX: number
  pointerY: number
}

/**
 * Miniatura de la primera página, apoyada junto al puntero.
 *
 * Se posiciona en `position: fixed` a partir de la posición del ratón en vez de
 * quedar dentro de la entrada: así ningún `overflow` de contenedor la recorta y
 * siempre queda dentro del viewport.
 */
export function PdfThumbnail({ url, active, pointerX, pointerY }: PdfThumbnailProps) {
  const [source, setSource] = useState<HTMLCanvasElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active || !url) return

    // Se espera a que el puntero se asiente, para no lanzar la carga al pasar
    // por encima de la entrada de camino a otra.
    const timer = setTimeout(() => {
      void renderFirstPage(url).then((canvas) => {
        if (canvas) setSource(canvas)
      })
    }, HOVER_DELAY)

    return () => clearTimeout(timer)
  }, [active, url])

  // El canvas cacheado se copia a uno visible: el mismo canvas no puede estar
  // en dos sitios del DOM a la vez.
  useEffect(() => {
    const target = canvasRef.current
    if (!target || !source) return

    target.width = source.width
    target.height = source.height
    target.getContext('2d')?.drawImage(source, 0, 0)
  }, [source])

  /*
    El canvas cacheado se conserva entre hovers: al sacarlo de la vista no hace
    falta olvidarlo, y conservarlo hace que el segundo hover sea instantaneo.
  */
  if (!active || !source) return null

  // Se ancla al borde derecho cuando el puntero está en la última mitad.
  const flipped = pointerX > window.innerWidth - THUMB_WIDTH - VIEWPORT_MARGIN * 3
  const rawLeft = flipped ? pointerX - THUMB_WIDTH - 20 : pointerX + 20
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, rawLeft),
    window.innerWidth - THUMB_WIDTH - VIEWPORT_MARGIN,
  )

  // Si no cabe debajo del puntero, se coloca por encima.
  const height = Math.round((source.height / source.width) * THUMB_WIDTH)
  const rawTop = pointerY + 20 + height > window.innerHeight - VIEWPORT_MARGIN ? pointerY - height - 20 : pointerY + 20
  const top = Math.max(VIEWPORT_MARGIN, rawTop)

  return (
    <div className="pdf-thumbnail" style={{ top, left }} aria-hidden="true">
      <canvas ref={canvasRef} style={{ width: THUMB_WIDTH, height }} />
    </div>
  )
}