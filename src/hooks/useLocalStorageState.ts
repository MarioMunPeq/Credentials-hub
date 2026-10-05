import { useCallback, useEffect, useState } from 'react'

/**
 * Estado sincronizado con `localStorage`.
 *
 * Lee de forma diferida para que el primer render ya use el valor guardado y
 * no haya un parpadeo de tema o idioma.
 *
 * La lectura se envuelve en `try/catch`: abrir el sitio en modo privado o con
 * cookies bloqueadas hace que `localStorage` lance `SecurityError`, y eso no
 * debe romper la aplicacion.
 */
export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? initialValue : (JSON.parse(raw) as T)
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* Almacenamiento no disponible: el estado sigue vivo en memoria. */
    }
  }, [key, value])

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return [value, setValue, reset] as const
}