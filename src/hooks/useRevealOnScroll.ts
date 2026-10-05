import { useEffect } from 'react'

/**
 * Revela los elementos marcados con `.revelable` según entran en pantalla.
 *
 * Se observa al contenedor de contenido, no a cada elemento por separado, y se
 * marcan en bloque al aparecer: entrar y salir mientras el elemento está a medio
 * ver produce un parpadeo, y aquí no hay nada que ganar con animar la salida.
 *
 * Se pone `data-visible` y no una clase porque el elemento necesita poder estar
 * revelado para siempre (los que ya estaban en pantalla al cargar) y volver a
 * revelarse si hiciera falta.
 */
export function useRevealOnScroll(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = root.current

    /*
      El estado oculto de `.revelable` solo existe bajo `.motion-ready`. Aquí se
      añade esa clase, y solo cuando `IntersectionObserver` está disponible: sin
      él no habría forma de revelar nada y el contenido se quedaría invisible.
    */
    if (!container || typeof IntersectionObserver === 'undefined') return

    document.documentElement.classList.add('motion-ready')

    const targets = container.querySelectorAll<HTMLElement>('.revelable')
    if (targets.length === 0) {
      document.documentElement.classList.remove('motion-ready')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-visible', 'true')
          observer.unobserve(entry.target)
        }
      },
      {
        // `rootMargin` negativo por arriba: el elemento tiene que estar un poco
        // dentro de la pantalla, no solo rozarla, o aparecería antes de tiempo.
        root: container,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.01,
      },
    )

    for (const target of targets) observer.observe(target)

    return () => {
      observer.disconnect()
      document.documentElement.classList.remove('motion-ready')
    }
  }, [root])
}