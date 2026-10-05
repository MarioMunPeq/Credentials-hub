/**
 * Apertura circular del cambio de tema.
 *
 * Un simple `transition: background-color` en el `body` no funciona bien: los dos
 * temas no tienen el mismo número de superficies, así que cada elemento con
 * color propio hace su propio fade y la página se ve como un collage parpadeante
 * durante medio segundo. Aquí no se anima ningún color. Se pone un rectángulo del
 * color de destino encima de todo y se agranda en círculo desde el botón hasta
 * cubrir la pantalla. Cuando el círculo llega al borde ya no se ve, y el tema de
 * verdad se cambia por debajo. Nunca se ve una mezcla de los dos.
 *
 * Por eso el tema se cambia al final y no al principio: si se cambiara primero,
 * el rectángulo taparía justo lo que se quiere enseñar.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useTheme } from '../context/theme-context'

/**
 * Duración de la apertura, en ms. Ha de coincidir con `--theme-reveal` del CSS,
 * o el temporizador de seguridad se dispararía antes de que la transición acabe.
 */
const DURATION = 620

/** Margen que se suma al temporizador de seguridad, en ms. */
const SAFETY = 240

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Contrapartida de un tema. */
function opposite(theme: string): 'light' | 'dark' {
  return theme === 'dark' ? 'light' : 'dark'
}

/**
 * Devuelve una función que cambia de tema animando desde `origin`.
 *
 * @param origin Elemento desde el que sale el círculo, normalmente el botón.
 */
export function useThemeReveal() {
  const { theme, setTheme } = useTheme()
  const cleanup = useRef<(() => void) | null>(null)

  // Si el componente se desmonta a mitad de la animación, hay que quitar el
  // rectángulo: si no se queda un círculo esmeralda clavado en la pantalla.
  useEffect(() => () => cleanup.current?.(), [])

  return useCallback(
    (origin: HTMLElement) => {
      const target = opposite(theme)

      if (prefersReducedMotion() || typeof document === 'undefined') {
        setTheme(target)
        return
      }

      // Un clic en mitad de la animación abandona la anterior.
      cleanup.current?.()

      const box = origin.getBoundingClientRect()
      const x = box.left + box.width / 2
      const y = box.top + box.height / 2

      // Radio necesario para cubrir la esquina más lejana desde el botón.
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      )

      const overlay = document.createElement('div')
      overlay.className = 'theme-reveal'
      overlay.setAttribute('aria-hidden', 'true')
      overlay.dataset.theme = target
      overlay.style.setProperty('--reveal-x', `${x}px`)
      overlay.style.setProperty('--reveal-y', `${y}px`)
      overlay.style.setProperty('--reveal-radius', `${radius}px`)

      let finished = false
      let timer = 0

      const finish = () => {
        if (finished) return
        finished = true
        window.clearTimeout(timer)
        overlay.remove()
        cleanup.current = null
        setTheme(target)
      }

      // `transitionend` no dispara si la pestaña pasa a segundo plano, así que
      // hace falta también un temporizador.
      overlay.addEventListener('transitionend', finish, { once: true })
      timer = window.setTimeout(finish, DURATION + SAFETY)
      cleanup.current = finish

      document.body.append(overlay)

      // Dos fotogramas: el primero pinta el círculo a radio cero, el segundo lo
      // lleva al radio final. Con uno solo el navegador no registra el estado
      // inicial y la transición se salta entera.
      requestAnimationFrame(() => {
        overlay.dataset.expanded = 'true'
      })
    },
    [theme, setTheme],
  )
}