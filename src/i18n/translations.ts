export type Language = 'es' | 'en'

export const LANGUAGES: { code: Language; label: string; short: string }[] = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
]

/**
 * Español. Este objeto define la forma de las traducciones: `en` se declara con
 * el mismo tipo, de modo que añadir una clave obliga a traducirla y quitar una
 * la rompe de forma visible.
 *
 * Sin `as const`: los textos deben quedar tipados como `string` (no como
 * literales), para que ambos idiomas sean asignables entre sí.
 */
const es = {
  meta: {
    title: 'Certificaciones',
    description:
      'Títulos oficiales, bootcamp de inteligencia artificial, idiomas y prevención de riesgos laborales, con toda la documentación verificable.',
  },

  header: {
    skipToContent: 'Saltar al contenido',
    portfolios: 'Portfolios',
    portfoliosMenu: 'Abrir la lista de portfolios y perfiles',
    language: 'Idioma',
    toggleTheme: 'Cambiar de tema',
    themeLight: 'Modo claro',
    themeDark: 'Modo oscuro',
  },

  nav: {
    label: 'Secciones',
  },

  /** Titulos de seccion. La clave coincide con `category` en el JSON. */
  sections: {
    estudios: 'Estudios oficiales',
    tecnologia: 'Tecnología',
    idiomas: 'Idiomas',
    prl: 'PRL',
    ia: 'Bootcamp de IA',
  },

  trajectory: {
    title: 'Resumen',
    /** Antetítulo que declara que esto resume el contenido de abajo. */
    kicker: 'En una línea',
    /** Frase que declara explícitamente que es un resumen de las secciones siguientes. */
    summaryNote: 'Lo mismo que hay abajo, compacto y en orden. Cada ficha lleva a su entrada.',
    /** Pista del índice, junto al contador. */
    summaryHint: 'Pulsa una ficha para ir a su entrada',
    /** Etiqueta accesible del gráfico completo. */
    regionLabel: 'Línea de tiempo de certificaciones',
    nodeLabel: (title: string, issuer: string, meta: string) =>
      `${title}, ${issuer}. ${meta}`,
    yearRange: (from: number, to: number) => `${from} — ${to}`,
    years: 'Años',
    /** Pista de scroll horizontal en móvil. */
    swipeHint: 'Desliza',
    /** Texto para quien no ve el gráfico. */
    alternativeText:
      'Esta información aparece también como lista en las secciones siguientes.',
    hours: 'Horas',
    /** Etiqueta de la ficha en reposo, que resume el conjunto. */
    certificates: 'certificados',
    /** Resumen del índice de credenciales, en la cabecera. */
    summary: (count: number, hours: string | null) =>
      hours ? `${count} certificados · ${hours}` : `${count} certificados`,
    goToEntry: 'Ir a la ficha',
  },

  entry: {
    download: 'Descargar',
    /** Nombre accesible del botón de descarga, que ya no lleva texto visible. */
    downloadTitle: 'Descargar el PDF',
    verify: 'Verificar',
    verifyTitle: 'Abrir la página oficial de verificación',
    missingPdf: 'PDF no disponible',
    /** Texto alternativo de la miniatura flotante. */
    thumbnailAlt: (title: string) => `Primera página de ${title}`,
  },

  modal: {
    close: 'Cerrar la vista previa',
    download: 'Descargar',
    noPreview: 'Este navegador no puede mostrar el PDF incrustado.',
    openPdf: 'Abrir PDF',
  },

  footer: {
    repository: 'Repositorio',
    updated: 'Actualizado',
  },

  states: {
    loading: 'Cargando certificaciones…',
    errorTitle: 'No se pudieron cargar las certificaciones',
    errorHint:
      'Comprueba que el archivo public/data/certificates.json existe y contiene JSON válido.',
    fileProtocolTitle: 'El sitio se está abriendo desde el disco',
    fileProtocolHint:
      'El navegador bloquea la lectura de archivos locales. Ejecuta "npm run dev" o "npm run preview" en el proyecto.',
    retry: 'Reintentar',
  },

  empty: {
    noDataTitle: 'Todavía no hay certificaciones',
    noDataHint: 'Añade el primer PDF en public/certs y su entrada en certificates.json.',
  },
}

export type TranslationShape = typeof es

const en: TranslationShape = {
  meta: {
    title: 'Certifications',
    description:
      'Formal degrees, AI bootcamp, languages and occupational safety training, with every document verifiable.',
  },

  header: {
    skipToContent: 'Skip to content',
    portfolios: 'Portfolios',
    portfoliosMenu: 'Open the list of portfolios and profiles',
    language: 'Language',
    toggleTheme: 'Switch theme',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
  },

  nav: {
    label: 'Sections',
  },

  sections: {
    estudios: 'Formal studies',
    tecnologia: 'Technology',
    idiomas: 'Languages',
    prl: 'Occupational safety',
    ia: 'AI bootcamp',
  },

  trajectory: {
    title: 'Overview',
    kicker: 'On one line',
    summaryNote:
      'The same thing below, compact and in order. Every card links to its entry.',
    summaryHint: 'Press a card to jump to its entry',
    regionLabel: 'Timeline of certifications',
    nodeLabel: (title: string, issuer: string, meta: string) =>
      `${title}, ${issuer}. ${meta}`,
    yearRange: (from: number, to: number) => `${from} — ${to}`,
    years: 'Years',
    swipeHint: 'Swipe',
    alternativeText:
      'This information is also available as a list in the sections below.',
    hours: 'Hours',
    certificates: 'certifications',
    summary: (count: number, hours: string | null) =>
      hours ? `${count} certifications · ${hours}` : `${count} certifications`,
    goToEntry: 'Go to entry',
  },

  entry: {
    download: 'Download',
    downloadTitle: 'Download the PDF',
    verify: 'Verify',
    verifyTitle: 'Open the official verification page',
    missingPdf: 'PDF not available',
    thumbnailAlt: (title: string) => `First page of ${title}`,
  },

  modal: {
    close: 'Close preview',
    download: 'Download',
    noPreview: 'This browser cannot display the embedded PDF.',
    openPdf: 'Open PDF',
  },

  footer: {
    repository: 'Repository',
    updated: 'Updated',
  },

  states: {
    loading: 'Loading certifications…',
    errorTitle: 'Could not load the certifications',
    errorHint: 'Check that public/data/certificates.json exists and contains valid JSON.',
    fileProtocolTitle: 'This site is being opened from disk',
    fileProtocolHint:
      'The browser blocks local file reads. Run "npm run dev" or "npm run preview" in the project instead.',
    retry: 'Retry',
  },

  empty: {
    noDataTitle: 'There are no certifications yet',
    noDataHint: 'Add the first PDF in public/certs and its entry in certificates.json.',
  },
}

export const translations = { es, en }