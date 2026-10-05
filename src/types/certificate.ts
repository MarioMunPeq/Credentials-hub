/**
 * Modelo de datos de un certificado.
 *
 * La fuente de verdad es `public/data/certificates.json`, que se carga en
 * tiempo de ejecucion. Por eso los tipos son deliberadamente permisivos
 * (`category: string`, `hours: number | string | null`): un fichero JSON
 * escrito a mano no cumple ningun contrato de tipos y la aplicacion debe
 * quedarse utilizable aunque contenga errores.
 *
 * Cada campo obligatorio se valida en tiempo de carga
 * (ver `src/data/loadCertificates.ts`).
 */
export interface Certificate {
  /** Identificador unico y estable. Se usa como clave de React y como ancla. */
  id: string
  /** Nombre oficial del titulo, curso o certificacion. */
  title: string
  /** Entidad emisora: universidad, centro, empresa o certificadora. */
  issuer: string
  /**
   * Fecha de emision. Formatos admitidos (de mas a menos preciso):
   *   "2025-03-14" | "2025-03" | "2025"
   */
  date: string
  /** Duracion en horas. Admite `0`, `null` o la cadena `"40"` sin romper la web. */
  hours: number | string | null
  /**
   * Clave de categoria. Usa las de `CATEGORY_ORDER` o crea una nueva sin
   * tocar codigo (aparecera en los filtros con el nombre capitalizado).
   */
  category: string
  /** Etiquetas libres para busqueda y filtrado. */
  tags: string[]
  /**
   * Ruta del PDF relativa a la carpeta `public/`.
   * Ejemplo: "certs/estudios/mi-certificado.pdf"
   */
  pdf: string
  /** Enlace publico de verificacion. Opcional: si no existe, no se muestra. */
  verifyUrl?: string
  /**
   * Version corta del titulo, para las etiquetas de la trayectoria.
   *
   * Admite dos formas: un texto unico para los dos idiomas, o un objeto con
   * una version por idioma. Opcional: si no esta, la web recorta el titulo.
   */
  shortTitle?: string | { es: string; en: string }
}

/**
 * Certificado validado y normalizado.
 *
 * No contiene textos ya traducidos: solo datos. Las etiquetas de fecha y horas
 * dependen del idioma activo y se calculan al pintar, de modo que cambiar de
 * ES a EN no obliga a volver a descargar el JSON.
 */
export interface ProcessedCertificate {
  id: string
  title: string
  issuer: string
  /** Fecha original tal cual aparece en el JSON. */
  date: string
  /** Componentes de la fecha ya validados (null si el dato falta o es invalido). */
  dateParts: { year: number | null; month: number | null; day: number | null }
  /** Clave numerica AAAAMMDD para ordenar. Los campos ausentes cuentan como 0. */
  sortKey: number
  /** Horas como numero. `0` cuando el dato no existe. */
  hours: number
  category: string
  tags: string[]
  /** URL absoluta del PDF, respetando el `base` de GitHub Pages. */
  pdfUrl: string
  verifyUrl: string | null
  /** Titulo corto por idioma, o `null` si el JSON no lo declara. */
  shortTitle: { es: string; en: string } | null
}

/**
 * Una certificacion con su version corta ya resuelta al idioma activo.
 *
 * Es lo que pintan la trayectoria y las entradas, para no tener que decidir el
 * idioma en cada componente.
 */
export interface DisplayCertificate {
  certificate: ProcessedCertificate
  /** `shortTitle` del JSON, o el titulo recortado con elipsis. */
  short: string
  dateLabel: string
  hoursLabel: string | null
}

/** Vista activa del listado. */
export type CertificateStatus = 'loading' | 'ready' | 'error'