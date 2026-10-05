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
   * El tema del que esta hecho el portfolio. Cada uno recrea algo concreto, asi
   * que la etiqueta es lo que permite escanear la lista sin leer las seis
   * descripciones: seis nombres sin contexto no dicen nada.
   */
  tag: { es: string; en: string }
  /**
   * Agrupa destinos que van juntos. El desplegable dibuja un separador
   * cuando el grupo cambia: primero los sitios propios, despues los perfiles.
   */
  group: 'sites' | 'profiles'
}

const REPO = 'https://github.com/MarioMunPeq'

export const portfolioLinks: PortfolioLink[] = [
  {
    id: 'persona5',
    label: 'Persona 5',
    url: 'https://mariomunpeq.is-a.dev/',
    group: 'sites',
    tag: { es: 'CV en vivo', en: 'Live CV' },
    description: {
      es: 'El CV como experiencia web, con estética Persona 5',
      en: 'The CV as a web experience, Persona 5 style',
    },
  },
  {
    id: 'repository-library',
    label: 'Steam Portfolio',
    url: 'https://mariomunpeq.github.io/Steam-Portfolio/',
    group: 'sites',
    tag: { es: 'Steam', en: 'Steam' },
    description: {
      es: 'Los proyectos explored como si fueran videojuegos',
      en: 'Projects explored as if they were video games',
    },
  },
  {
    id: 'papers-please',
    label: 'Papers, Please',
    url: 'https://mariomunpeq.github.io/Papers-Please-Portfolio/',
    group: 'sites',
    tag: { es: 'Puesto de inspección', en: 'Inspection desk' },
    description: {
      es: 'El portfolio disfrazado de mostrador fronterizo',
      en: 'The portfolio disguised as a border checkpoint',
    },
  },
  {
    id: 'minecraft',
    label: 'Minecraft',
    url: 'https://mariomunpeq.github.io/Minecraft-Portfolio/',
    group: 'sites',
    tag: { es: 'Mundo explorable', en: 'Explorable world' },
    description: {
      es: 'Todo el portfolio dentro de un mundo por recorrer',
      en: 'The whole portfolio inside a world to walk around',
    },
  },
  {
    id: 'vault-archive',
    label: 'Fallout Portfolio',
    url: 'https://mariomunpeq.github.io/Fallout-Portfolio/',
    group: 'sites',
    tag: { es: 'Fallout 3', en: 'Fallout 3' },
    description: {
      es: 'Seis módulos dentro de un Pip-Boy 3000',
      en: 'Six modules inside a Pip-Boy 3000',
    },
  },
  {
    id: 'euromario',
    label: 'Euromario',
    url: 'https://mariomunpeq.github.io/Euromario/',
    group: 'sites',
    tag: { es: 'App con IA', en: 'AI app' },
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
    tag: { es: 'Perfil', en: 'Profile' },
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
    tag: { es: 'Perfil', en: 'Profile' },
    description: {
      es: 'Perfil profesional',
      en: 'Professional profile',
    },
  },
]

/** Cuantos de la lista son sitios propios, para el contador del disparador. */
export const siteCount = portfolioLinks.filter((link) => link.group === 'sites').length

/** Repositorio de este mismo sitio, enlazado en el pie. */
export const repositoryUrl = `${REPO}/Credentials-hub`

/** Descripcion de un enlace en el idioma activo. */
export function describe(link: PortfolioLink, language: Language): string {
  return link.description[language]
}

/** Etiqueta de tema de un enlace en el idioma activo. */
export function tagOf(link: PortfolioLink, language: Language): string {
  return link.tag[language]
}
