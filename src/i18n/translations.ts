export type Language = 'es' | 'en'

export const LANGUAGES: { code: Language; label: string; short: string }[] = [
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
]

/**
 * Español. El objeto define la forma de las traducciones: `en` se declara con
 * el mismo tipo, de modo que añadir una clave obliga a traducirla y quitar una
 * la rompe de forma visible.
 *
 * Sin `as const`: los textos deben quedar tipados como `string` (no como
 * literales), para que ambos idiomas sean asignables entre sí.
 */
const es = {
  meta: {
    title: 'Certificaciones | Credentials Hub',
    description:
      'Portfolio de certificaciones: títulos oficiales, tecnología, idiomas, PRL y formación en inteligencia artificial.',
  },
  header: {
    role: 'Certificaciones y formación',
    tagline:
      'Títulos oficiales, certificaciones tecnológicas, idiomas, PRL y formación en IA.',
    skipToContent: 'Saltar al contenido',
    toggleLanguage: 'Cambiar idioma',
    toggleTheme: 'Cambiar tema',
    themeLight: 'Modo claro',
    themeDark: 'Modo oscuro',
    portfolios: 'Otros portfolios',
    portfoliosLabel: 'Ver mis otros portfolios',
    portfoliosPlaceholder: 'Elegir portfolio…',
  },
  stats: {
    title: 'Resumen',
    certificates: 'Certificados',
    hours: 'Horas de formación',
    categories: 'Categorías',
  },
  toolbar: {
    searchLabel: 'Buscar certificaciones',
    searchPlaceholder: 'Buscar por título, entidad o etiqueta',
    clearSearch: 'Limpiar búsqueda',
    filters: 'Filtros',
    categories: 'Categoría',
    tags: 'Etiquetas',
    clearFilters: 'Quitar filtros',
    activeFilters: 'Filtros activos',
    view: 'Vista',
    viewCards: 'Tarjetas',
    viewTimeline: 'Línea de tiempo',
    sort: 'Orden',
    sortDesc: 'Más recientes primero',
    sortAsc: 'Más antiguos primero',
    resultCount: (count: number, total: number) =>
      count === total
        ? `${count} ${count === 1 ? 'certificado' : 'certificados'}`
        : `${count} de ${total} certificados`,
    hoursUnit: 'h',
  },
  card: {
    download: 'Descargar PDF',
    preview: 'Vista previa',
    verify: 'Verificar',
    verifyTitle: 'Abrir la página oficial de verificación',
    issuedBy: 'Emisor',
    issuedOn: 'Fecha',
    duration: 'Duración',
    missingPdf: 'PDF no disponible',
  },
  modal: {
    close: 'Cerrar',
    openedIn: 'El PDF se muestra en una ventana incrustada del navegador.',
    noPreview: 'Tu navegador no puede mostrar este PDF de forma incrustada.',
    openInNewTab: 'Abrir en una pestaña nueva',
  },
  timeline: {
    title: 'Trayectoria',
    emptyYear: 'Sin año',
  },
  states: {
    loading: 'Cargando certificaciones…',
    errorTitle: 'No se pudieron cargar las certificaciones',
    errorHint:
      'Comprueba que el archivo public/data/certificates.json existe y es un JSON válido.',
    fileProtocolTitle: 'El sitio se está abriendo directamente desde el archivo',
    fileProtocolHint:
      'Los navegadores bloquean la lectura de archivos locales al abrir index.html con doble clic. Ejecuta "npm run dev" o "npm run preview" en el proyecto.',
    retry: 'Reintentar',
  },
  empty: {
    title: 'Ningún certificado coincide con los filtros',
    hint: 'Prueba a quitar algún filtro o a buscar con otras palabras.',
    clearAll: 'Ver todos los certificados',
    noDataTitle: 'Todavía no hay certificados',
    noDataHint: 'Añade el primer PDF en public/certs y su entrada en certificates.json.',
  },
  footer: {
    builtWith: 'Sitio estático generado con Vite y React.',
    dataSource: 'Datos en public/data/certificates.json',
    backToPortfolios: 'Volver a mis portfolios',
    rights: (year: number) => `© ${year}`,
  },
}

export type TranslationShape = typeof es

const en: TranslationShape = {
  meta: {
    title: 'Certifications | Credentials Hub',
    description:
      'Certification portfolio: formal degrees, technology, languages, occupational safety and AI training.',
  },
  header: {
    role: 'Certifications and training',
    tagline:
      'Formal degrees, technology certifications, languages, occupational safety and AI training.',
    skipToContent: 'Skip to content',
    toggleLanguage: 'Switch language',
    toggleTheme: 'Switch theme',
    themeLight: 'Light mode',
    themeDark: 'Dark mode',
    portfolios: 'Other portfolios',
    portfoliosLabel: 'See my other portfolios',
    portfoliosPlaceholder: 'Choose a portfolio…',
  },
  stats: {
    title: 'Summary',
    certificates: 'Certificates',
    hours: 'Training hours',
    categories: 'Categories',
  },
  toolbar: {
    searchLabel: 'Search certifications',
    searchPlaceholder: 'Search by title, issuer or tag',
    clearSearch: 'Clear search',
    filters: 'Filters',
    categories: 'Category',
    tags: 'Tags',
    clearFilters: 'Clear filters',
    activeFilters: 'Active filters',
    view: 'View',
    viewCards: 'Cards',
    viewTimeline: 'Timeline',
    sort: 'Sort',
    sortDesc: 'Newest first',
    sortAsc: 'Oldest first',
    resultCount: (count: number, total: number) =>
      count === total
        ? `${count} ${count === 1 ? 'certificate' : 'certificates'}`
        : `${count} of ${total} certificates`,
    hoursUnit: 'h',
  },
  card: {
    download: 'Download PDF',
    preview: 'Preview',
    verify: 'Verify',
    verifyTitle: 'Open the official verification page',
    issuedBy: 'Issuer',
    issuedOn: 'Date',
    duration: 'Duration',
    missingPdf: 'PDF not available',
  },
  modal: {
    close: 'Close',
    openedIn: 'The PDF is displayed in the browser built-in viewer.',
    noPreview: 'Your browser cannot display this PDF inline.',
    openInNewTab: 'Open in a new tab',
  },
  timeline: {
    title: 'Career path',
    emptyYear: 'No year',
  },
  states: {
    loading: 'Loading certifications…',
    errorTitle: 'Could not load the certifications',
    errorHint:
      'Check that public/data/certificates.json exists and contains valid JSON.',
    fileProtocolTitle: 'This site is being opened directly from the file',
    fileProtocolHint:
      'Browsers block local file reads when index.html is opened by double click. Run "npm run dev" or "npm run preview" in the project instead.',
    retry: 'Retry',
  },
  empty: {
    title: 'No certificate matches the filters',
    hint: 'Try removing a filter or searching with different words.',
    clearAll: 'Show all certificates',
    noDataTitle: 'There are no certificates yet',
    noDataHint: 'Add the first PDF in public/certs and its entry in certificates.json.',
  },
  footer: {
    builtWith: 'Static site built with Vite and React.',
    dataSource: 'Data in public/data/certificates.json',
    backToPortfolios: 'Back to my portfolios',
    rights: (year: number) => `© ${year}`,
  },
}

export const translations = { es, en }