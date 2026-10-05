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

/**
 * Ancho de la miniatura en px. La altura sale de la proporción de la página.
 *
 * A 220px el texto del PDF era ilegible: la miniatura informaba de que había un
 * documento, pero no de qué. A 500px se lee. El render se hace siempre a este
 * ancho y en pantallas estrechas se deja que el CSS lo reduzca, así que la caché
 * sirve igual en móvil y en escritorio.
 */
const THUMB_WIDTH = 500

/** Ancho mínimo antes de empezar a reducir la miniatura. */
const THUMB_MIN_WIDTH = 200

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

    let rendered = false
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
      rendered = true
      return canvas
    } finally {
      /*
        `destroy()` no solo cierra el documento: termina también el worker que
        comparte pdf.js, y el siguiente hover se encontraría sin él. Como la
        página ya está en `cache`, no hay nada que liberar en el camino bueno y
        solo se destruye cuando el render falla a medias.
      */
      if (!rendered) void loadingTask.destroy()
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
  /** Lado izquierdo de la entrada en px de viewport, o `null` si se desconoce. */
  entryLeft: number | null
  /** Anchura de la entrada en px, o `null` si se desconoce. */
  entryWidth: number | null
  /** Coordenada vertical del puntero, en px. */
  pointerY: number
}

/**
 * Miniatura de la primera página, anclada a la entrada y no al puntero.
 *
 * Se posiciona en `position: fixed` para que ningún `overflow` de contenedor la
 * recorte, pero **horizontalmente se ancla a la entrada, no al ratón**. Con el
 * puntero, a 500px de ancho la miniatura tapaba el texto de la columna de al
 * lado y además se movía cada vez que el ratón cambiaba de píxel dentro de la
 * entrada, que se lee como un parpadeo.
 *
 * Anclada a la entrada, el ancho se limita al de la propia columna: así es
 * imposible que invada a la vecina, por grande que se ponga.
 */
export function PdfThumbnail({
  url,
  active,
  entryLeft,
  entryWidth,
  pointerY,
}: PdfThumbnailProps) {
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

  /*
    El canvas cacheado se copia a uno visible: el mismo canvas no puede estar en
    dos sitios del DOM a la vez.

    `active` va en las dependencias a propósito. Al salir del hover el componente
    devuelve `null` y el canvas visible se desmonta, así que al volver hay un
    `<canvas>` nuevo y vacío. Si el efecto solo dependiera de `source`, que ya
    está en caché, no volvería a dibujarse y la miniatura saldría gris.
  */
  useEffect(() => {
    const target = canvasRef.current
    if (!target || !source || !active) return

    target.width = source.width
    target.height = source.height
    target.getContext('2d')?.drawImage(source, 0, 0)
  }, [source, active])

  /*
    El canvas cacheado se conserva entre hovers: al sacarlo de la vista no hace
    falta olvidarlo, y conservarlo hace que el segundo hover sea instantaneo.
  */
  if (!active || !source) return null

  /*
    El canvas siempre se renderiza a THUMB_WIDTH, pero el ancho de presentación se
    calcula contra la entrada: si la columna es más estrecha que la miniatura, se
    reduce hasta caber dentro. Con THUMB_WIDTH como tope y el ancho de la columna
    como límite, la miniatura nunca puede invadir la columna vecina.
  */
  const gutter = VIEWPORT_MARGIN
  const columnLimit =
    entryWidth !== null ? Math.max(THUMB_MIN_WIDTH, entryWidth - gutter * 2) : THUMB_WIDTH
  const width = Math.min(THUMB_WIDTH, columnLimit, window.innerWidth - gutter * 6)
  const height = Math.round((source.height / source.width) * width)

  /*
    Sin caja conocida se cae al puntero, que es lo que había antes. Solo pasa en el
    primer fotograma, antes de que la entrada haya medido nada.
  */
  let left: number
  if (entryLeft !== null && entryWidth !== null) {
    left = entryLeft + gutter
    // Si a la derecha se sale del viewport, se voltea dentro de la entrada.
    if (left + width > window.innerWidth - gutter) {
      left = Math.max(gutter, entryLeft + entryWidth - width - gutter)
    }
  } else {
    left = Math.min(Math.max(gutter, 20), window.innerWidth - width - gutter)
  }

  // Verticalmente sí sigue al puntero, y si no cabe debajo se coloca por encima.
  const rawTop =
    pointerY + 20 + height > window.innerHeight - VIEWPORT_MARGIN
      ? pointerY - height - 20
      : pointerY + 20
  const top = Math.max(VIEWPORT_MARGIN, rawTop)

  return (
    <div className="pdf-thumbnail" style={{ top, left }} aria-hidden="true">
      <canvas ref={canvasRef} style={{ width, height }} />
    </div>
  )
}