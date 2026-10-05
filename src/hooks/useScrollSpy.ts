import { useEffect, useState, type RefObject } from 'react'

/** Margen desde el borde superior del viewport a partir del cual una sección ya cuenta como activa. */
const DEFAULT_OFFSET = 96

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
  offset?: number
}

/** Un elemento solo cuenta como scroller si realmente tiene contenido que deslocar. */
function scrolls(element: HTMLElement | null): element is HTMLElement {
  return element !== null && element.scrollHeight > element.clientHeight + 1
}

/**
 * Marca la seccion que se esta leyendo.
 *
 * Se mide la posicion de las secciones en cada scroll en lugar de usar
 * IntersectionObserver: aqui interesa "la ultima seccion cuyo inicio ya ha
 * pasado la linea", que es una regla de posicion y no de solapamiento, y asi
 * el comportamiento es predecible con secciones cortas.
 */
export function useScrollSpy(ids: readonly string[], options: ScrollSpyOptions = {}) {
  const { scroller, offset = DEFAULT_OFFSET } = options
  const [active, setActive] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    const element = scroller?.current ?? null
    let frame = 0

    const compute = () => {
      frame = 0

      // Sin secciones visibles (busqueda vacia o filtro) el valor es null, asi
      // que no hace falta un caso especial con setState.
      let current: string | null = ids[0] ?? null

      for (const id of ids) {
        const target = document.getElementById(id)
        if (!target) continue
        if (target.getBoundingClientRect().top - offset <= 0) current = id
      }

      // Al llegar al final se marca la ultima seccion: si no, un grupo final
      // corto deja activa la anterior. La medicion se hace sobre quien
      // desplaza de verdad.
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

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      element?.removeEventListener('scroll', schedule)
    }
  }, [ids, offset, scroller])

  return active
}