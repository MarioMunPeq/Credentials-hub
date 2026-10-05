/**
 * Datos personales del sitio.
 *
 * =========================================================================
 *  Este fichero y `src/config/links.ts` son lo unico que hay que editar para
 *  adaptar el sitio a otra persona. Los enlaces externos viven alli.
 * =========================================================================
 */

export const site = {
  /** Nombre completo. Se muestra en la cabecera (Newsreader) y en el pie. */
  name: 'Mario Muñoz Pequeño',

  /** Titulo profesional, bajo el nombre. Tamano pequeno, gris. */
  role: {
    es: 'Desarrollador full stack',
    en: 'Full stack developer',
  },

  /**
   * Parrafo del hero. Se muestra en 2-3 lineas; la medida maxima la fija el
   * CSS (`--measure-hero`), no los saltos de linea de este texto.
   */
  hero: {
    es: 'Grado superior en Desarrollo de Aplicaciones Multiplataforma con mención honorífica en el TFG, bootcamp de inteligencia artificial y formación complementaria en Android, idiomas y prevención de riesgos laborales. Toda la documentación es verificable.',
    en: 'Higher degree in Multiplatform Application Development with distinction in the final project, AI bootcamp and further training in Android, languages and occupational safety. Every document can be verified.',
  },
} as const

export type Site = typeof site
