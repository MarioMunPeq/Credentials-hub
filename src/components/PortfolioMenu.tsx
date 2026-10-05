import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useLanguage } from '../context/language-context'
import { describe, portfolioLinks } from '../config/links'
import { ChevronIcon, ExternalLinkIcon } from './icons'

/** Debajo de este ancho el panel deja de ser un menu y pasa a ser hoja inferior. */
const SHEET_QUERY = '(max-width: 39.999rem)'

type FocusTarget = 'first' | 'last' | number

/** Holgura minima entre el panel y el borde de la ventana, en px. */
const EDGE_GAP = 8

/**
 * Menú desplegable de portfolios, construido a mano.
 *
 * Patrón `menu button`: el disparador lleva `aria-expanded` y `aria-controls`,
 * y el panel es un `role="menu"` con items `role="menuitem"`. Los items llevan
 * `tabindex="-1"` y el foco se mueve por script, como establece el patrón: así
 * las flechas recorren el menú y Tab lo abandona entero.
 *
 * **Detección de colisión**: el panel se mide una vez pintado y se decide si
 * abre hacia arriba o hacia abajo según el hueco real que quede, en lugar de
 * asumir una posición y esperar que no se salga.
 *
 * Teclado:
 *   - Disparador: Enter / Espacio / Flecha Abajo abren; Flecha Arriba abre
 *     dejando el foco en el último item; Escape cierra.
 *   - Panel: flechas recorren (con vuelta), Home/End van a los extremos,
 *     Escape cierra y devuelve el foco al disparador, Tab cierra.
 *   - Clic fuera y clic en un item cierran.
 */
export function PortfolioMenu() {
  const { language, t } = useLanguage()
  const [open, setOpen] = useState(false)
  /** `true` si no cabe debajo y el panel se abre hacia arriba. */
  const [opensUp, setOpensUp] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  /** Donde debe quedar el foco justo después de abrir. */
  const pendingFocus = useRef<FocusTarget>('first')
  /** Si se abrió como hoja inferior, el fondo no debe poder desplazarse. */
  const asSheet = useRef(false)

  const panelId = useId()
  const triggerId = useId()

  const focusItem = useCallback((index: number) => {
    // El array de refs no se puede leer durante el render: se filtra aquí, en
    // el momento en que hace falta.
    const items = itemRefs.current.filter((item): item is HTMLAnchorElement => item !== null)
    if (items.length === 0) return

    // El índice puede llegar negativo (se pide "el último").
    const position = ((index % items.length) + items.length) % items.length
    items[position]?.focus()
  }, [])

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }, [])

  const openAt = useCallback((target: FocusTarget) => {
    asSheet.current = typeof window !== 'undefined' && window.matchMedia(SHEET_QUERY).matches
    pendingFocus.current = target
    setOpen(true)
  }, [])

  /*
    El foco se aplica en un efecto, cuando el panel ya está en el DOM. Hacerlo
    en el manejador del clic sería demasiado pronto: React aún no lo ha pintado.
  */
  useEffect(() => {
    if (!open) return

    const target = pendingFocus.current
    if (target === 'first') focusItem(0)
    else if (target === 'last') focusItem(-1)
    else focusItem(target)
  }, [open, focusItem])

  /*
    Detección de colisión. Se mide el panel ya pintado y se compara con el hueco
    real: si por debajo no cabe pero por arriba sí, se voltea.
  */
  useLayoutEffect(() => {
    if (!open || asSheet.current) return

    const panel = panelRef.current
    const trigger = triggerRef.current
    if (!panel || !trigger) return

    const below = window.innerHeight - trigger.getBoundingClientRect().bottom - EDGE_GAP
    setOpensUp(panel.offsetHeight > below)
  }, [open])

  // Cierre al pulsar fuera del desplegable.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  // Bloqueo del scroll de fondo, solo en modo hoja inferior.
  useEffect(() => {
    if (!open || !asSheet.current) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Si se ensancha a escritorio, el panel cierra en lugar de cambiar de forma.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const query = window.matchMedia(SHEET_QUERY)
    const onChange = () => {
      if (!query.matches) setOpen(false)
    }

    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        openAt('first')
        break
      case 'ArrowUp':
        event.preventDefault()
        openAt('last')
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          close()
        }
        break
      default:
        break
    }
  }

  /** Mueve el foco `delta` items respecto al elemento que lo tiene ahora. */
  const moveFocus = (current: HTMLElement, delta: number) => {
    const items = itemRefs.current.filter((item): item is HTMLAnchorElement => item !== null)
    const index = items.indexOf(current as HTMLAnchorElement)
    focusItem(index === -1 ? (delta > 0 ? 0 : -1) : index + delta)
  }

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveFocus(event.target as HTMLElement, 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveFocus(event.target as HTMLElement, -1)
        break
      case 'Home':
        event.preventDefault()
        focusItem(0)
        break
      case 'End':
        event.preventDefault()
        focusItem(-1)
        break
      case 'Escape':
        event.preventDefault()
        close()
        break
      case 'Tab':
        // Tab abandona el menú: se cierra sin retener el foco.
        close(false)
        break
      default:
        break
    }
  }

  return (
    <div className="dropdown" ref={containerRef}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="dropdown__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? panelId : undefined}
        aria-label={t.header.portfoliosMenu}
        onClick={() => (open ? close() : openAt('first'))}
        onKeyDown={onTriggerKeyDown}
      >
        {t.header.portfolios}
        <ChevronIcon className="dropdown__chevron" />
      </button>

      {open && (
        <>
          <div className="dropdown__scrim" onClick={() => close()} aria-hidden="true" />

          <div
            ref={panelRef}
            id={panelId}
            className={`dropdown__panel${opensUp ? ' dropdown__panel--up' : ''}`}
            role="menu"
            aria-labelledby={triggerId}
            onKeyDown={onPanelKeyDown}
          >
            <ul className="dropdown__list">
              {portfolioLinks.map((link, index) => {
                // Separador hairline al cambiar de grupo: primero los sitios
                // propios, después los perfiles profesionales.
                const separator = index > 0 && portfolioLinks[index - 1]?.group !== link.group

                return (
                  <li key={link.id} role="none">
                    {separator && <div className="dropdown__sep" role="separator" />}
                    <a
                      ref={(element) => {
                        itemRefs.current[index] = element
                      }}
                      className="dropdown__item"
                      role="menuitem"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={-1}
                      onClick={() => setOpen(false)}
                    >
                      <span className="dropdown__text">
                        <span className="dropdown__name">{link.label}</span>
                        <span className="dropdown__description">
                          {describe(link, language)}
                        </span>
                      </span>
                      <ExternalLinkIcon className="dropdown__icon" />
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}