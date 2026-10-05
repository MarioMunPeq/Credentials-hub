# Credentials Hub

Portfolio profesional de certificaciones. Sitio estatico, sin backend: todos los
datos salen de un unico fichero JSON y los PDF se sirven tal cual desde la carpeta
`public/`.

- **Stack:** Vite + React + TypeScript
- **Despliegue:** GitHub Pages mediante GitHub Actions
- **Datos:** `public/data/certificates.json`
- **PDF:** `public/certs/<categoria>/<archivo>.pdf`

---

## Diseño

Estilo dev/técnico con toque editorial minimalista. Sin sombras marcadas, sin
degradados y sin nada de estética de videojuego.

| Decisión | Cómo está resuelto |
| --- | --- |
| Modo oscuro por defecto | Paleta base oscura en `:root`; el modo claro va en `[data-theme='light']`. El script de `index.html` decide **antes del primer paint**, así que no hay destello al cargar. |
| Respeta `prefers-color-scheme` | Si el sistema pide claro y el visitante no ha elegido nada, recibe claro. Después, la elección se guarda. |
| Un solo acento | Verde esmeralda (`--accent`) para enlaces, botones y estados activos. No hay un segundo color de interfaz. |
| Tipografías | **Inter** para texto y títulos. **JetBrains Mono** solo para fechas, horas, etiquetas y metadatos. |
| Sin dependencias externas | Ambas fuentes se sirven desde el propio dominio (`@fontsource-variable`), no desde Google Fonts: el sitio funciona sin conexion a terceros y no filtra las visitas. |
| 16 px de cuerpo | Regla explícita en `global.css`: la jerarquía se construye con peso, color y espaciado entre letras, nunca bajando el cuerpo. |
| Máx. ~70 caracteres | `--measure: 68ch` en los bloques de texto. |
| Bordes finos | Un único grosor de borde en todo el sitio. Sin `box-shadow` decorativo. |
| Color por categoría | Un tono suave y distinto por familia (estudios, tecnología, idiomas, PRL, IA) que aparece **solo** en la etiqueta y en el punto de la línea de tiempo. Nunca en bordes ni fondos. |
| Mobile first | Una columna en móvil, 2 desde 640 px y 3 desde 1024 px. |
| Zonas táctiles | `--tap: 44px` como mínimo en botones, chips, selects y el conmutador de tema. |
| Filtros en móvil | Filas con desplazamiento horizontal; en pantallas anchas pasan a varias filas y a dos columnas. |
| Línea de tiempo | Eje vertical fijo a la izquierda, agrupada por año. |
| Vista previa del PDF | A pantalla completa en móvil; diálogo centrado con borde desde 640 px. |
| Animaciones | Solo transiciones cortas de color y opacidad. `prefers-reduced-motion` las desactiva todas. |

Los colores, la tipografía, el ritmo y las medidas viven todos como variables
CSS al principio de `src/styles/global.css`. Cambiar el aspecto no requiere
tocar componentes.

---

## Antes de publicar (importante)

Hay dos cosas que debes cambiar antes de subir el sitio:

1. **`src/config/site.ts`** — tu nombre, tu rol, la frase de presentación y los
   enlaces a tus otros portfolios. Ahora mismo son datos de ejemplo
   (`Nombre Apellidos`, enlaces a `example.com`).
2. **`public/data/certificates.json`** — sustituye los 5 certificados de ejemplo
   por los tuyos.

> **Aviso sobre datos personales:** antes de subir un PDF, tapa la información
> identificativa que tenga (DNI/NIE, número de registro, dirección, teléfono,
> firma o foto). Detalles en [Antes de subir un PDF](#antes-de-subir-un-pdf-tapar-datos-personales).

---

## Puesta en marcha

```bash
npm install       # instala dependencias
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # comprueba tipos y genera dist/
npm run preview   # sirve dist/ tal cual se publicara
npm run lint      # ESLint
npm run typecheck # solo comprobacion de tipos
```

> No abras `dist/index.html` con doble clic. Los navegadores bloquean la lectura
> de archivos locales (`fetch` sobre `file://`) y el sitio no podrá cargar el
> JSON. Usa siempre `npm run preview`.

---

## Cómo añadir un certificado

Son dos pasos, siempre los mismos.

### 1. Copia el PDF

Coloca el fichero en `public/certs/<categoria>/`, usando `minúsculas`, sin
espacios y con la extensión `.pdf`:

```
public/certs/estudios/master-ingenieria-software.pdf
public/certs/tecnologia/cloud-developer-associate.pdf
public/certs/idiomas/ingles-b2.pdf
public/certs/prl/recurso-preventivo-50h.pdf
public/certs/ia/bootcamp-ia-aplicada.pdf
```

La carpeta no tiene que existir: créala si hace falta. Cualquier subcarpeta vale,
pero **`pdf` debe apuntar a la ruta correcta dentro de `public/`**.

### 2. Añade la entrada en el JSON

Edita `public/data/certificates.json` y añade un objeto más a la lista:

```json
{
  "id": "cloud-developer-associate",
  "title": "Cloud Developer — Associate",
  "issuer": "Plataforma Cloud de Ejemplo",
  "date": "2024-03-15",
  "hours": 70,
  "category": "tecnologia",
  "tags": ["cloud", "devops", "api"],
  "pdf": "certs/tecnologia/cloud-developer-associate.pdf",
  "verifyUrl": "https://example.com/verify/cloud-developer-associate"
}
```

Listo. No hay que registrar el certificado en ningún otro sitio: la web lo lee
todo del JSON, así que basta con guardar los cambios y hacer `push`.

### Campos del JSON

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `id` | No* | Identificador único. Si falta, se genera uno a partir de la posición. Se usa como clave de React, así que **no lo repitas**. |
| `title` | **Sí** | Nombre oficial del título o certificación. |
| `issuer` | **Sí** | Entidad emisora: universidad, centro, empresa o certificadora. |
| `date` | No | Fecha de emisión. Formatos: `"2025"`, `"2025-03"` o `"2025-03-14"`. Cuantos más campos, más precisa. |
| `hours` | No | Duración en horas. Number o `null`. También acepta `"40"`. Si no lo indicas, el certificado no muestra horas. |
| `category` | **Sí** | Clave de categoría (ver tabla siguiente). |
| `tags` | No | Lista de etiquetas para buscar y filtrar. Se normalizan a minúsculas y se ordenan solas. |
| `pdf` | No | Ruta del PDF **relativa a `public/`**, con `/` como separador. Si falta o no existe, el certificado aparece sin botones. |
| `verifyUrl` | No | Enlace público de verificación. Si no lo pones, no se muestra el botón. |

\* `id` es obligatorio en la práctica: sin él la web genera uno, pero con `id`
explícito el enlace al certificado es estable.

### Categorías

Las cinco de serie, con su carpeta y su color en la interfaz:

| `category` | Se muestra como | Carpeta |
| --- | --- | --- |
| `estudios` | Estudios oficiales | `public/certs/estudios/` |
| `tecnologia` | Tecnología | `public/certs/tecnologia/` |
| `idiomas` | Idiomas | `public/certs/idiomas/` |
| `prl` | PRL | `public/certs/prl/` |
| `ia` | Bootcamp de IA | `public/certs/ia/` |

**Para añadir una categoría nueva** no hace falta tocar el código: usa una clave
libre (`recursos-humanos`, `salud`, …). Aparecerá sola en los filtros, con el
nombre capitalizado y un color neutro.

Si quieres que tenga un nombre propio y un color propio en los dos idiomas,
añádela a `CATEGORY_ORDER`, `CATEGORY_LABELS` y `CATEGORY_ACCENT` en
`src/utils/categories.ts`. El orden de `CATEGORY_ORDER` es el orden en que se
muestran los filtros.

### scripts/redact-certs.py

Censura los PDF de `public/certs/` y les pone nombre en minúsculas. Guarda
copia de los originales en `%TEMP%\opencode\certs-originales\` por si hay que
empezar de nuevo.

```bash
python scripts/redact-certs.py
```

Hace dos cosas distintas según el documento:

- **Con capa de texto**: busca el dato con `search_for()` y lo borra del flujo
  de contenido con `apply_redactions()`. Redacción real, irrecuperable.
- **Escaneados**: rasteriza la página, pone los píxeles a blanco y reconstruye
  el PDF con la imagen ya modificada. Guarda como JPEG, porque en PNG los
  títulos de la Junta pasaban de 300 KB a 10 MB.

Los datos que busca están en la lista `SECRETS` y las zonas a tapar en
`SCANNED_BOXES`, en fracciones de 0 a 1 de la página. **Si añades un
certificado escaneado nuevo, mide las coordenadas con `grid-overlay.py`** (dibuja
una rejilla de porcentajes sobre el original) y revisa el resultado con
`render-scans.py`: la verificación automática no ve el texto que va dentro de
una imagen.

### PDF de ejemplo

Mientras no tengas los documentos reales, puedes generar un PDF de muestra por
cada entrada del JSON:

```bash
npm run certs:placeholder           # solo los que falten
node scripts/generate-placeholder-pdfs.mjs --force   # regenera todos
```

Cada PDF lleva una banda superior de «documento de ejemplo» para que no se
confunda con un certificado auténtico. **Cuando añadas documentos reales, no
uses este script**: borra antes los PDF de ejemplo que quieras sustituir.

---

## Antes de subir un PDF: tapar datos personales

Los certificados oficiales llevan datos que **no** quieres en un repositorio
público. Todo lo que subas a `public/certs/` queda accesible sin contraseña en
tu URL de GitHub Pages y en cualquier clon del repositorio.

Este sitio ya viene con los PDF censurados (ver
[scripts/redact-certs.py](#scripts-redact-certspy)), pero cada certificado
nuevo que añadas hay que revisarlo.

### Qué se ha censurado aquí

| Dato | Dónde salía |
| --- | --- |
| DNI/NIE | Los 7 documentos, impreso junto al nombre en los títulos oficiales y en el «Nº …» del título del bootcamp |
| CIE (código de identidad del título) | Certificados de la Junta de Castilla y León |
| Fecha y lugar de nacimiento | Certificado de la ESO |
| Número de registro central y autónomo de títulos, y su código de barras | Certificado de la ESO |
| Número de candidato | Informe de Trinity ISE II |
| Referencia interna de documento (`FP…`) | Certificados de la Junta de Castilla y León |
| Metadatos del fichero | Todos: autoría, productor, título (el de Trinity además incluía el número de candidato) |

Se conserva el nombre, la entidad, las fechas, las horas, la nota final y el
número de certificado: son los datos que hacen prueba.

### Cómo censurar tú un PDF nuevo

**Importante: tapar no es lo mismo que borrar.** Si solo pintas un rectángulo
negro encima, el texto sigue ahí debajo. Cualquiera que selecte y copie el
texto lo vería, igual que una búsqueda en el PDF. En un PDF **escaneado** es
peor: el rectángulo es solo un dibujo encima, y la imagen original se puede
recuperar tal cual.

Hay dos técnicas distintas según el tipo de documento:

| Tipo de PDF | Cómo censurar |
| --- | --- |
| **Con capa de texto** (los de ASPY Prevención y el del bootcamp) | Herramienta de redacción real. PyMuPDF borra los glifos del flujo de contenido: el texto desaparece de verdad. |
| **Escaneado**, es decir, una imagen de un documento (los títulos de la Junta y el de Trinity) | Hay que **modificar los píxeles** de la imagen y reconstruir el PDF. Un rectángulo encima no sirve. |

Herramientas:

| Herramienta | Cómo | Sirve para |
| --- | --- | --- |
| **Este proyecto** | `python scripts/redact-certs.py` | Ambos casos, con la lista de datos sensibles ya escrita. |
| **Acrobat Pro** | `Herramientas > Redactar`, marcar y **aplicar**. Después guarda: los datos se eliminan. | Con capa de texto |
| **PDF24 Desktop** | `Editar PDF > Redactar texto`. Gratuito. | Con capa de texto |
| **qpdf + script** | Automatizable si tienes muchos documentos. | Con capa de texto |
| **Imprimir a PDF** | Imprimir el documento y elegir «Guardar como PDF». La opción más simple: no se copia el original, solo se reimprime. Tapa antes en el visor de impresión. | Ambos, pero pierde la capa de texto |

### Comprobar que ha funcionado

```bash
python scripts/inspect-certs.py   # vuelca el texto y avisa de los datos sensibles
python scripts/render-scans.py    # renderiza a PNG para revisarlo a ojo
```

Ojo: `inspect-certs.py` **no ve nada dentro de una imagen**. Para los
escaneados, `render-scans.py` es obligatorio: abre los PNG y comprueba que no
queda nada legible. Es exactamente el fallo que se dio al censor este proyecto:
el número de candidato de Trinity pasó la verificación automática porque no
había texto que extraer, y seguía visible en la imagen.

Comprueba también buscando el DNI dentro del PDF (Ctrl+F en el visor). Si
aparece, no lo publiques.

Una alternativa al borrado, si necesitas conservar el documento íntegro: no lo
subas y enlaza al certificado desde `verifyUrl`, o guárdalo en un servicio
privado. En la tarjeta, el certificado seguirá apareciendo con su botón de
verificación.

---

## Personalizar el aspecto

| Quiero… | Dónde |
| --- | --- |
| Cambiar nombre, rol o enlaces a otros portfolios | `src/config/site.ts` |
| Cambiar textos de la interfaz | `src/i18n/translations.ts` (objetos `es` y `en`) |
| Cambiar colores, tipografías o espaciados | `src/styles/global.css` (bloque `:root` y `[data-theme='light']`) |
| Cambiar iconos | `src/components/icons.tsx` |

El tema se guarda en `localStorage` (`credentials-hub:theme`). Si no hay elección
guardada, se respeta `prefers-color-scheme` y, si el sistema no expresa
preferencia, se usa el modo oscuro.

---

## Despliegue en GitHub Pages

El flujo ya viene configurado en `.github/workflows/deploy.yml`.

### 1. Sube el repositorio

```bash
git init
git add .
git commit -m "Configura el portfolio de certificaciones"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

Los PDF **sí se suben** al repositorio: son necesarios para compilar. Si
`.gitignore` los excluyera, GitHub Pages publicaría el sitio sin certificados.

### 2. Activa GitHub Pages

En el repositorio:

`Settings` → `Pages` → `Source`: **GitHub Actions**.

Eso es todo: no hay que seleccionar rama ni carpeta.

### 3. Cada `push` a `main` publica

El workflow hace, en orden:

1. `npm ci` — instala con `package-lock.json`, que falla si no cuadra.
2. `npm run typecheck` — si hay errores de tipos, no se publica.
3. `npm run lint` — si hay errores de lint, no se publica.
4. `npm run build` — genera `dist/`.
5. `upload-pages-artifact` + `deploy-pages` — publica en GitHub Pages.

Solo se permite un despliegue a la vez: si llega un commit nuevo mientras se
publica el anterior, se cancela el antiguo y GitHub Pages conserva la versión
ya publicada en lugar de quedar a medio construir.

La dirección será:

```
https://<usuario>.github.io/<repo>/
```

El workflow define `SITE_BASE` a partir del nombre real del repositorio, así
que el prefijo no hay que mantenerlo a mano. Si el repositorio se llama
`<usuario>.github.io` (página de usuario), cambia esa línea a `"/"`; el
despliegue entonces quedaría en la raíz del dominio.

### desplegar a mano

```bash
npm run build
```

`dist/` queda listo para subir tal cual. Ten en cuenta que `npm run build` en
local usa el valor por defecto de `vite.config.ts` (`/Credentials-hub/`), así que
si el repositorio se llama de otra forma, compila con la variable puesta:

```bash
SITE_BASE=/mi-repo/ npm run build      # macOS / Linux (Git Bash)
$env:SITE_BASE="/mi-repo/"; npm run build   # PowerShell en Windows
```

---

## Estructura del proyecto

```
.
├── .github/workflows/deploy.yml   # publicación automática en cada push a main
├── public/                        # se copia tal cual a dist/
│   ├── data/certificates.json     # ← todos los certificados viven aquí
│   └── certs/<categoria>/*.pdf    # ← los PDF
├── scripts/
│   └── generate-placeholder-pdfs.mjs
├── src/
│   ├── components/                # interfaz (tarjetas, línea de tiempo, modal…)
│   ├── config/site.ts             # ← nombre, rol y enlaces a otros portfolios
│   ├── context/                   # idioma y tema
│   ├── data/loadCertificates.ts   # descarga, validación y normalización del JSON
│   ├── hooks/
│   ├── i18n/translations.ts       # textos ES/EN
│   ├── types/certificate.ts       # forma de un certificado
│   ├── utils/                     # fechas, categorías, búsqueda y ordenación
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/global.css          # ← colores, tipografías y espaciados
├── index.html
├── vite.config.ts                 # ← base path de GitHub Pages
└── package.json
```

### Decisiones que conviene conocer

- **Todo el contenido sale de `certificates.json`.** No hay base de datos ni
  build step que modifique los datos: editar el JSON es la única forma de tocar
  el contenido.
- **Un JSON con errores no rompe la web.** Al cargar se validan los registros:
  los que no tienen `title`, `issuer` o `category` se descartan con un aviso en
  la consola, y el resto se muestra igual. Un `id` duplicado o ausente se
  corrige solo.
- **Las fechas se ordenan por número, no por texto**, y se formatean con el
  idioma activo. Por eso cambiar de ES a EN no vuelve a descargar nada.
- **El buscador ignora mayúsculas y acentos:** «redes neuronales» encuentra
  «Redes Neuronales».
- **Los filtros combinan así:** varias palabras clave se unen con *o*, y las
  categorías y etiquetas con *y*.
- **Ninguna ruta empieza por `/`.** En el JSON, `pdf` es relativo a `public/`
  (`certs/...`); el prefijo de GitHub Pages se añade al construir la URL. Así
  el sitio funciona igual en local, en un subdirectorio y en la raíz del
  dominio.

---

## Licencia

Las certificaciones y sus PDF son documentos personales: decide tú bajo qué
licencia publicas el código de este repositorio.