import { useEffect, useState } from 'react'

/**
 * Marca la seccion que se esta leyendo.
 *
 * Se mide la posicion de las secciones en cada scroll en lugar de usar
 * IntersectionObserver: aqui interesa "la última sección cuyo inicio ya ha
 * pasado la línea", que es una regla de posición y no de solapamiento, y así
 * el comportamiento es predecible con secciones cortas.
 */
export function useScrollSpy(ids: readonly string[], offset = 96) {
  const [active, setActive] = useState<string | null>(ids[0] ?? null)

  useEffect(() => {
    let frame = 0

    const compute = () => {
      frame = 0

      // Sin secciones visibles (busqueda vacia o vista de linea de tiempo) el
      // valor es null, asi que no hace falta un caso especial con setState.
      let current: string | null = ids[0] ?? null

      for (const id of ids) {
        const element = document.getElementById(id)
        if (!element) continue
        if (element.getBoundingClientRect().top - offset <= 0) current = id
      }

      // Al llegar al final de la pagina se marca la ultima seccion: si no, un
      // grupo final corto deja activa la anterior.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (ids.length > 0 && atBottom) current = ids[ids.length - 1] ?? current

      setActive((previous) => (previous === current ? previous : current))
    }

    // Todo el calculo se agenda en un fotograma, tambien el inicial: llamar a
    // setState en el cuerpo del efecto provoca renders en cascada.
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(compute)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ids, offset])

  return active
}