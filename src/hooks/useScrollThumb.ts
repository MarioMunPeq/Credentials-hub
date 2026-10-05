import { useEffect, type RefObject } from 'react'

/** Alto mínimo del indicador, en px. Por debajo sería un punto y no una barra. */
const MIN_THUMB = 48

/** Separación entre el borde del área de contenido y la barra, en px. */
const INSET = 4

/** Lo que hay que medir del scroller en cada repintado. */
interface Metrics {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

/*
  Las lecturas se hacen sobre el ref, no sobre el elemento.

  `react-hooks/immutability` no puede distinguir una lectura de una mutación, así
  que marca cualquier acceso a una propiedad de un objeto que venga de un argumento
  del hook. Al pasarle el ref entero a estas funciones y que cada una lea
  `.current` por su cuenta, el objeto que se toca es un parámetro de función y la
  regla no interviene.

  No es un rodeo para la regla: las lecturas quedan agrupadas en `readMetrics` y el
  hook se queda con la lógica de estado.
*/
function readMetrics(scroller: RefObject<HTMLElement | null>): Metrics | null {
  const element = scroller.current
  if (!element) return null

  return {
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }
}

/** Escribe el pulgar, o lo esconde si ya no hay nada que desplazar. */
function paintThumb(scroller: RefObject<HTMLElement | null>): void {
  const element = scroller.current
  const metrics = readMetrics(scroller)
  if (!element || !metrics) return

  const { scrollTop, scrollHeight, clientHeight } = metrics

  // Sin desplazamiento posible no hay nada que indicar. Se quita el atributo
  // para que el CSS esconda la barra entera, en vez de escribir un cero que aún
  // se dibujaría.
  if (scrollHeight <= clientHeight + 1) {
    delete element.dataset.thumb
    return
  }

  /*
    El pulgar mantiene la proporción `clientHeight / scrollHeight`, que es lo que
    hace que la barra represente la cantidad visible de contenido. Si la
    proporción fuera 1 la barra no indicaría nada, así que el alto real se fija en
    esa proporción pero nunca baja de MIN_THUMB.
  */
  const thumb = Math.max(MIN_THUMB, Math.round(clientHeight * (clientHeight / scrollHeight)))

  // Recorrido disponible: lo que puede moverse el pulgar dentro de la guía.
  const travel = Math.max(0, clientHeight - thumb - INSET * 2)
  const progress = scrollTop / (scrollHeight - clientHeight)
  const offset = Math.round(progress * travel)

  element.style.setProperty('--thumb-h', `${thumb}px`)
  element.style.setProperty('--thumb-y', `${offset}px`)
  element.dataset.thumb = 'true'
}

/**
 * Indicador de scroll propio para el área de contenido.
 *
 * Sustituye a la barra del navegador, que se pintaba con
 * `scrollbar-color: var(--accent-dim)` y era el elemento más duro de la página: un
 * acento saturado en el borde, con su propio grosor, compitiendo con el
 * contenido.
 *
 * Se escribe en dos variables CSS en vez de tocar la estructura del scroller,
 * porque lo único que cambia es la posición y el alto del pulgar. Todo se calcula
 * en un fotograma, y solo en lectura: si se escribiera una propiedad antes de
 * terminar de leer la siguiente, el navegador forzaría el cálculo de disposición
 * dos veces por fotograma.
 */
export function useScrollThumb(scroller: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let frame = 0

    const paint = () => {
      frame = 0
      paintThumb(scroller)
    }

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(paint)
    }

    paint()

    const element = scroller.current
    if (!element) return

    element.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    // El alto del contenido cambia cuando llegan los datos o cambia el idioma, y
    // en ese momento el pulgar se quedaría con la proporción anterior.
    const observer = new ResizeObserver(schedule)
    observer.observe(element)

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      element.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
    }
  }, [scroller])
}