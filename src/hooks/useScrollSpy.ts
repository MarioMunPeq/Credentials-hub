import { useEffect, useState, type RefObject } from 'react'

/**
 * Fracción de la altura del scroller donde está la línea de lectura.
 *
 * Es una fracción y no un margen fijo en píxeles, y esa es toda la diferencia.
 * La regla original era "activa la sección cuya cabecera ya ha pasado los 96px
 * desde arriba", o sea que una sección se activaba al desplazar
 * `posición − 96`. Con cinco secciones en un documento que apenas da mil píxeles de
 * recorrido, las dos últimas necesitan más scroll del que existe: sus cabeceras
 * están a 1292px y 1746px, y el máximo es 996, así que jamás llegaban a los 96px
 * y sus renglones del menú no se encendían nunca.
 *
 * Bajando la línea de lectura al 35% de la altura, una sección se activa al
 * desplazar `posición − 0,35 × altura`. Como el término del medio crece con el
 * viewport, las secciones del final se activan antes y todas llegan a verse. Y es
 * la regla correcta por sí misma: la sección que se está leyendo es la que ocupa
 * esa franja, no la que tiene su cabecera pegada al borde superior.
 */
const READING_LINE = 0.35

/** Holgura para el final del documento, en px. */
const BOTTOM_GAP = 2

interface ScrollSpyOptions {
  /**
   * Elemento que desplaza, si lo hay.
   *
   * Importa porque en el layout de dos paneles el scroll no ocurre en la
   * ventana: lo hace el area de contenido. Los eventos `scroll` no burbujean,
   * asi que si solo se escucha en `window` el espia se quedaria congelado, y el
   * calculo de "estoy al final" daria siempre `true` porque el documento
   * entero cabe en la pantalla.
   */
  scroller?: RefObject<HTMLElement | null>
  /** Fracción de la altura donde se lee, de 0 a 1. */
  readingLine?: number
}

/** Un elemento solo cuenta como scroller si realmente tiene contenido que deslocar. */
function scrolls(element: HTMLElement | null): element is HTMLElement {
  return element !== null && element.scrollHeight > element.clientHeight + 1
}

/**
 * Distancia vertical de un elemento hasta el inicio del área que desplaza,
 * subiendo por la cadena de `offsetParent`.
 *
 * Se usa `offsetTop` y no `getBoundingClientRect()` por dos razones. Una: el
 * revelado de las entradas aplica `transform: translateY(14px)`, y
 * `getBoundingClientRect` **incluye** las transformaciones, así que una
 * cabecera sin revelar mide 14px más abajo de lo que está y se activa antes de
 * tiempo. Dos: recorrer la cadena de `offsetParent` es más barato que medir el
 * rectángulo de cada sección en cada fotograma.
 */
function offsetWithin(element: HTMLElement, container: HTMLElement | null): number {
  let total = 0
  let node: HTMLElement | null = element

  while (node && node !== container) {
    total += node.offsetTop
    // En móvil el scroller es la ventana: el recorrido termina en `body`.
    if (node.tagName === 'BODY') return total
    node = node.offsetParent as HTMLElement | null
  }

  return total
}

/**
 * Marca la seccion que se esta leyendo.
 *
 * Se mide en cada scroll en lugar de usar `IntersectionObserver` porque aqui
 * interesa "la ultima seccion cuya cabecera ya ha pasado la linea", que es una
 * regla de posicion y no de solapamiento, y asi el comportamiento es predecible
 * con secciones cortas.
 */
export function useScrollSpy(ids: readonly string[], options: ScrollSpyOptions = {}) {
  const { scroller, readingLine = READING_LINE } = options
  const [active, setActive] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    const element = scroller?.current ?? null
    let frame = 0

    const compute = () => {
      frame = 0

      const height = scrolls(element) ? element.clientHeight : window.innerHeight
      const line = height * readingLine

      // Sin secciones visibles el valor es null, asi que no hace falta un caso
      // especial con setState.
      let current: string | null = ids[0] ?? null

      for (const id of ids) {
        const target = document.getElementById(id)
        if (!target) continue
        if (offsetWithin(target, element) - line <= elementScrollTop(element)) current = id
      }

      // Al llegar al final se marca la ultima seccion. Sin esto la ultima nunca
      // se ilumina: no hay scroll suficiente para que su cabecera llegue a la
      // linea, y el final del documento es el unico momento en que se esta
      // leyendo de verdad.
      const atBottom = scrolls(element)
        ? element.scrollTop + element.clientHeight >= element.scrollHeight - BOTTOM_GAP
        : window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - BOTTOM_GAP

      if (ids.length > 0 && atBottom) current = ids[ids.length - 1] ?? current

      setActive((previous) => (previous === current ? previous : current))
    }

    // Todo el calculo se agenda en un fotograma, tambien el inicial: llamar a
    // setState en el cuerpo del efecto provoca renders en cascada.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(compute)
    }

    schedule()
    // Se escucha en los dos: en movil desplaza la ventana, en escritorio el
    // area de contenido, y no se sabe cual de los dos esta activo sin mirar.
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    element?.addEventListener('scroll', schedule, { passive: true })

    /*
      El alto del contenido cambia cuando llegan los datos o cambia el idioma, y
      con el espia en modo posicion las posiciones quedan desfasadas: la ultima
      seccion activa seria la de la altura anterior. Sin esto solo se
      recalcularia al desplazar.
    */
    const observer = element ? new ResizeObserver(schedule) : null
    if (element && observer) observer.observe(element)

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      element?.removeEventListener('scroll', schedule)
      observer?.disconnect()
    }
  }, [ids, readingLine, scroller])

  return active
}

/** Desplazamiento actual del scroller, sea el elemento o la ventana. */
function elementScrollTop(element: HTMLElement | null): number {
  return element ? element.scrollTop : window.scrollY
}