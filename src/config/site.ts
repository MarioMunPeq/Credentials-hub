/**
 * Datos personales del sitio.
 *
 * =========================================================================
 *  Este fichero es lo unico que hay que editar para adaptar el sitio a ti.
 *  Los enlaces de abajo son reales; anade o quita los que te interesen.
 * =========================================================================
 */

export interface PortfolioLink {
  /** Texto del enlace, p. ej. "Portfolio de desarrollo web". */
  label: string
  /** URL completa, con https:// */
  url: string
  /** Descripcion corta para lectores de pantalla. */
  description?: string
}

export const site = {
  /** Nombre que aparece en la cabecera y en el pie. */
  name: 'Mario Muñoz Pequeño',

  /** Título profesional, mostrado bajo el nombre. */
  role: {
    es: 'Desarrollador web',
    en: 'Web developer',
  },

  /**
   * Frase corta de presentación. Si no la quieres, deja el texto vacío en los
   * dos idiomas y el bloque no se renderiza.
   */
  intro: {
    es: 'Grado superior en Desarrollo de Aplicaciones Multiplataforma con mención honorífica en el TFG, bootcamp de inteligencia artificial y Android. Títulos, certificaciones y formación verificable.',
    en: 'Higher degree in Multiplatform Application Development with distinction in the final project, AI bootcamp and Android. Degrees, certifications and verifiable training.',
  },

  /**
   * Enlaces a tus otros portfolios y perfiles.
   *
   * - `url` con el esquema incluido y sin barra final.
   * - Para ocultar el selector, deja el array vacio: `portfolios: []`.
   * - El primero de la lista es el que mas destaca: es el que conviene abrir
   *   en una pestana nueva al pulsar.
   */
  portfolios: [
    {
      label: 'Portfolio (CV en vivo)',
      url: 'http://mariomunpeq.is-a.dev/',
      description: 'Portfolio personal con estética inspirada en Persona 5',
    },
    {
      label: 'Repository Library',
      url: 'https://mariomunpeq.github.io/Repository-Library/',
      description: 'Portfolio interactivo con forma de cliente de Steam',
    },
    {
      label: 'Euromario',
      url: 'https://mariomunpeq.github.io/Euromario/',
      description: 'Agregador de noticias de videojuegos con IA',
    },
    {
      label: 'GitHub',
      url: 'https://github.com/MarioMunPeq',
      description: 'Código abierto',
    },
    {
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/mario-mu%C3%B1oz-peque%C3%B1o/',
      description: 'Perfil profesional',
    },
  ] as PortfolioLink[],

  /** Año que se muestra en el aviso de derechos del pie. */
  copyrightYear: new Date().getFullYear(),
} as const

export type Site = typeof site