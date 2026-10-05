/**
 * Enlaces externos del sitio.
 *
 * =========================================================================
 *  Para cambiar la lista, edita solo este fichero.
 *  `src/config/site.ts` tiene los datos personales (nombre, rol, hero).
 * =========================================================================
 */

import type { Language } from '../i18n/translations'

export interface PortfolioLink {
  /** Clave estable, usada como id del elemento del menu. */
  id: string
  /** Nombre visible del destino. */
  label: string
  /** URL completa, con esquema. */
  url: string
  /** Descripcion corta bajo el nombre. Se traduce por idioma. */
  description: { es: string; en: string }
  /**
   * Agrupa destinos que van juntos. El desplegable dibuja un separador
   * cuando el grupo cambia: primero los sitios propios, despues los perfiles.
   */
  group: 'sites' | 'profiles'
}

export const portfolioLinks: PortfolioLink[] = [
  {
    id: 'cv',
    label: 'Portfolio (CV en vivo)',
    url: 'http://mariomunpeq.is-a.dev/',
    group: 'sites',
    description: {
      es: 'CV interactivo, proyectos y experiencia',
      en: 'Interactive CV, projects and experience',
    },
  },
  {
    id: 'library',
    label: 'Repository Library',
    url: 'https://mariomunpeq.github.io/Repository-Library/',
    group: 'sites',
    description: {
      es: 'El portfolio con forma de cliente de Steam',
      en: 'The portfolio shaped like a Steam client',
    },
  },
  {
    id: 'euromario',
    label: 'Euromario',
    url: 'https://mariomunpeq.github.io/Euromario/',
    group: 'sites',
    description: {
      es: 'Agregador de noticias de videojuegos con IA',
      en: 'Video game news aggregator powered by AI',
    },
  },
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/MarioMunPeq',
    group: 'profiles',
    description: {
      es: 'Código abierto y proyectos',
      en: 'Open source and projects',
    },
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/mario-mu%C3%B1oz-peque%C3%B1o/',
    group: 'profiles',
    description: {
      es: 'Perfil profesional',
      en: 'Professional profile',
    },
  },
]

/** Repositorio de este mismo sitio, enlazado en el pie. */
export const repositoryUrl = 'https://github.com/MarioMunPeq/Credentials-hub'

/** Descripcion de un enlace en el idioma activo. */
export function describe(link: PortfolioLink, language: Language): string {
  return link.description[language]
}