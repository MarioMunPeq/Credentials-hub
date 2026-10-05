/**
 * Categorias de certificacion.
 *
 * Este orden solo afecta a la presentacion (los filtros y la linea de tiempo
 * los recorren en este orden). Puedes anadir una categoria nueva escribiendola
 * aqui: aparecera automaticamente en los filtros.
 */
export const CATEGORY_ORDER = ['estudios', 'tecnologia', 'idiomas', 'prl', 'ia'] as const

export type KnownCategory = (typeof CATEGORY_ORDER)[number]

/** Traducciones de las categorias conocidas. Cualquier otra clave cae en un nombre derivado. */
export const CATEGORY_LABELS: Record<string, { es: string; en: string }> = {
  estudios: { es: 'Estudios oficiales', en: 'Formal studies' },
  tecnologia: { es: 'Tecnología', en: 'Technology' },
  idiomas: { es: 'Idiomas', en: 'Languages' },
  prl: { es: 'PRL', en: 'Occupational risk' },
  ia: { es: 'Bootcamp de IA', en: 'AI bootcamp' },
}

/** Etiquetas visualmente distintas para cada familia de certificacion. */
export const CATEGORY_ACCENT: Record<string, string> = {
  estudios: 'accent-studios',
  tecnologia: 'accent-tecnologia',
  idiomas: 'accent-idiomas',
  prl: 'accent-prl',
  ia: 'accent-ia',
}

/**
 * Convierte una clave de categoria en texto legible usando el idioma indicado.
 * Las categorias sin traduccion propia se capitalizan ("recursos-humanos" ->
 * "Recursos humanos"), de forma que anadir una categoria nueva no obliga a
 * tocar este fichero.
 */
export function categoryLabel(category: string, lang: 'es' | 'en'): string {
  const known = CATEGORY_LABELS[category]
  if (known) return known[lang]

  const words = category.replace(/[-_]+/g, ' ').trim()
  if (!words) return category

  return words.replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Clase de color asociada a la categoria. */
export function categoryAccent(category: string): string {
  return CATEGORY_ACCENT[category] ?? 'accent-default'
}