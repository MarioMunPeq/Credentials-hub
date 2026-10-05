/**
 * Cursor personalizado: cuatro corchetes de encuadre que siguen al puntero.
 *
 * Decisiones:
 * - Sustituye al cursor del sistema solo cuando hay puntero fino. En táctil no
 *   hay nada que sustituir y el elemento ni se monta, para no generar trabajo.
 * - Se posiciona con `transform` sobre un único elemento, sin re-renderizar en
 *   cada `pointermove`: el estado real vive en refs y el DOM se mueve con
 *   `requestAnimationFrame`.
 * - Lo interactivo se detecta con `closest()` y no leyendo el `cursor`
 *   calculado. El cursor del sistema está oculto en toda la página, así que el
 *   valor que devuelve el navegador es siempre `none` y no dice nada. La lista
 *   está centralizada aquí abajo: cualquier control nuevo que sea un `button`, un
 *   `a` o un `input` queda cubierto sin tocar el resto.
 * - `pointer-events: none` en el CSS: si no, el cursor se detectaría a sí mismo
 *   como elemento interactivo.
 *
 * Por qué corchetes y no una cruz: cuatro barras finas de 2px sobre texto de
 * 18px tienen la misma forma que los trazos de las letras y se camuflaban. Los
 * corchetes en las esquinas tienen silueta propia, se resuelven de un vistazo y
 * dejan el centro vacío, que es justo donde estás mirando.
 */

import { useEffect, useRef } from 'react'

/** Elementos sobre los que la retícula crece y se vuelve esmeralda. */
const INTERACTIVE =
  'a[href], button, [role="button"], [role="menuitem"], summary, select, [contenteditable]'

/** Campos donde la retícula se convierte en cursor de inserción. */
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable]'

/**
 * Zonas donde el navegador dibuja su propio puntero y no se puede llegar: el
 * visor de PDF incrustado y cualquier iframe. Ahí la retícula se aparta, porque
 * el cursor nativo ya está dentro del documento embebido.
 */
const EMBEDDED = 'object, iframe, embed'

export function CursorReticle() {
  const reticleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // `pointer: fine` y no `hover: hover`: en portátiles con pantalla táctil la
    // segunda se cumple y se habría quedado sin cursor en el táctil.
    if (!window.matchMedia('(pointer: fine)').matches) return

    const reticle = reticleRef.current
    if (!reticle) return

    /*
      Se marca el documento solo cuando la retícula está realmente en marcha, y el
      CSS que oculta el cursor del sistema se limita a ese caso. Si el script
      fallara, la pagina se quedaria sin cursor en todo el sitio: es un fallo
      pequeño de estetica frente a uno de usabilidad.
    */
    document.documentElement.dataset.cursor = 'custom'

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let frame = 0

    const paint = () => {
      frame = 0
      reticle.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }

    const onMove = (event: PointerEvent) => {
      const target = event.target as Element | null

      x = event.clientX
      y = event.clientY

      // `closest` sigue el árbol DOM, así que funciona igual con cualquier
      // elemento que se pinte por encima.
      const interactive = target?.closest(INTERACTIVE) ?? null
      const text = target?.closest(TEXT) ?? null
      const embedded = target?.closest(EMBEDDED) ?? null

      reticle.dataset.active = interactive ? 'true' : 'false'
      reticle.dataset.text = text ? 'true' : 'false'
      reticle.dataset.visible = embedded ? 'false' : 'true'

      if (frame === 0) frame = requestAnimationFrame(paint)
    }

    const onLeave = () => {
      reticle.dataset.visible = 'false'
    }

    const onDown = () => {
      reticle.dataset.pressed = 'true'
    }

    const onUp = () => {
      reticle.dataset.pressed = 'false'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('blur', onLeave)

    return () => {
      delete document.documentElement.dataset.cursor
      if (frame !== 0) cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('blur', onLeave)
    }
  }, [])

  return (
    <div ref={reticleRef} className="cursor-reticle" aria-hidden="true">
      <span className="cursor-reticle__corner cursor-reticle__corner--tl" />
      <span className="cursor-reticle__corner cursor-reticle__corner--tr" />
      <span className="cursor-reticle__corner cursor-reticle__corner--bl" />
      <span className="cursor-reticle__corner cursor-reticle__corner--br" />
    </div>
  )
}