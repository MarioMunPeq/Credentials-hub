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

Dos paneles a pantalla completa, con la trayectoria como pieza protagonista.
La tipografía y el espaciado hacen el trabajo y la decoración es casi
inexistente: todo alineado a la izquierda, un único acento y nada de cajas
alrededor del contenido.

### Estructura

**Escritorio (≥1024px).** Rejilla de dos columnas a `100dvh`:

- **Izquierda:** barra lateral fija de `clamp(300px, 22vw, 420px)` con scroll
  propio. De arriba abajo: nombre en Newsreader, rol, presentación, buscador,
  navegación con números de índice y scrollspy, y al pie —anclado con
  `margin-top: auto`— el desplegable de portfolios, el idioma, el tema y el pie.
- **Derecha:** el área de contenido, con el ancho restante completo y
  `padding: clamp(2rem, 4vw, 5rem)`. Es el **único elemento que desplaza**.

**Móvil (<1024px).** La misma barra lateral se convierte en la cabecera
superior: identidad a la izquierda, herramientas a la derecha, presentación
debajo, navegación en fila con scroll horizontal y, en su propia fila, el
buscador. El documento entero vuelve a hacer scroll normal.

El bloque es un solo `<aside>` con dos disposiciones, no dos DOM: duplicarlo
costaría más que un `order` y un mapa de áreas de grid.

### Escala fluida

```css
html { font-size: clamp(16px, 0.35vw + 14px, 19px); }
```

A 360px queda en el suelo de 16px y en 1440px llega al tope de 19px. Todo lo
que está en `rem` crece con ella, así que en 2560px el sitio se ve proporcional
y no diminuto.   --content-max está alineado a la izquierda para que en pantallas ultraanchas
  la composición se pegue al borde del área de contenido en vez de flotar en el
  centro.

### Rejilla técnica de fondo

Líneas de 1px cada 48px y una marcada cada 240px, fijas detrás de todo, con
`mask-image` radial que las desvanece hacia los bordes. Sin la atenuación la
rejilla se lee como papel de cuadras y compite con el texto; con ella se percibe
como textura. Los tonos (`3%` y `5%` en oscuro, `4%` y `6%` en claro) están por
debajo del umbral en el que estorban al contraste del texto.

### Trayectoria (sección 01)

Línea de tiempo horizontal a **escala temporal real**: el dominio va del 1 de
enero del año más antiguo al 31 de diciembre del más reciente, así que dos
certificados de mayo y de septiembre están a la distancia que les corresponde.

- **Nodos**: un círculo por certificado, con diámetro proporcional a la raíz
  cuadrada de las horas (10–40px). El área es fiel al valor; un diámetro
  proporcional achicaría las diferencias grandes. Anillo de 2px en el acento y
  relleno del color del fondo; relleno sólido en hover, foco y activo.
- **Etiquetas**: versión corta del título (campo `shortTitle` del JSON, o el
  título recortado a 28 caracteres) y la fecha en mono. Se colocan en **carriles
  verticales** —dos por encima del eje y dos por debajo— para que ninguna se
  solape. Las colisiones se calculan en píxeles reales del eje, no en
  porcentaje: dos puntos muy juntos en porcentaje pueden quedar muy lejos o muy
  cerca según el ancho de pantalla.
- **Clic**: lleva a la entrada correspondiente y la resalta con outline y fondo
  de superficie que se desvanece en 1,6s. Si la búsqueda la ocultaba, primero
  limpia la búsqueda.
- **Móvil**: el eje conserva 900px de ancho dentro de un contenedor con scroll
  horizontal y `scroll-snap`. Una pista «Desliza» desaparece tras el primer
  desplazamiento.

`scripts/check-trajectory.mjs` calcula la geometría con los datos reales y
comprueba que no hay solapes ni etiquetas ocultas a 900, 1200, 1600, 2000 y
2400px:

```bash
node scripts/check-trajectory.mjs
```

### Entradas

Sin caja: hairline superior y padding vertical generoso. Cada una lleva su
número de índice en mono y acento, el título en Inter 600, la entidad en gris,
la línea de fecha y horas, una **barra de horas** proporcional a la raíz
cuadrada respecto al máximo de la sección (con suelo del 3%), y las acciones
como enlaces de texto.

En dispositivos con ratón fino aparece una **miniatura de la primera página del
PDF** junto al puntero. Se renderiza con `pdf.js` cargado de forma diferida: el
import dinámico no está en el bundle inicial, y el worker se resuelve con
`?url` de Vite para que se sirva como fichero propio. La primera página ya
renderizada se cachea por URL, hay 250ms de retardo para que no parpadee al
mover el ratón, y cualquier fallo se traga: la miniatura es un extra y la
entrada tiene que seguir siendo utilizable sin ella.

### Decisiones de sistema

| Decisión | Cómo está resuelto |
| --- | --- |
| Modo oscuro por defecto | Paleta base en `:root`, claro en `[data-theme='light']`, aplicado antes del primer paint por el script de `index.html`. |
| Respeta `prefers-color-scheme` | Solo si el visitante no ha elegido. La elección se guarda en `localStorage`, con `try/catch`. |
| Un solo acento | `#56c3a0` en oscuro y `#1f8a6b` en claro. Índices, nodos, barra de horas, línea activa, enlaces y foco. Nunca como relleno de superficies ni de botones. |
| Tipografías | **Newsreader** para el nombre y los títulos de sección. **Inter** para texto e interfaz. **JetBrains Mono** solo para fechas, horas, índices y metadatos, con `tabular-nums`. Las tres autoalojadas con `@fontsource`. |
| Color por categoría | **No existe.** La familia la dice el título de la sección. |
| Etiquetas del JSON | **No se muestran.** Solo sirven como índice del buscador. |
| Zonas táctiles | 44px de alto en acciones, navegación e items del desplegable, con padding y sin tocar el tamaño de fuente. |
| Movimiento | Transiciones de 130–140ms. Sin animaciones de entrada, sin parallax, sin escalados. `prefers-reduced-motion` las elimina. |
| Foco | `outline: 2px` en el acento con `offset: 2px`, nunca eliminado. |

Los colores, la escala y el ritmo viven como variables al principio de
`src/styles/global.css`. Cambiar el aspecto no requiere tocar componentes.

---

## Antes de publicar (importante)

Hay dos cosas que debes cambiar antes de subir el sitio:

1. **`src/config/site.ts`** — tu nombre, tu rol y el párrafo del hero.
2. **`src/config/links.ts`** — los portfolios y perfiles, con sus URLs y sus
   descripciones en español e inglés.

> **Aviso sobre datos personales:** antes de subir un PDF, tapa la información
> identificativa que tenga (DNI, número de registro, fecha de nacimiento). Ya
> está hecho en los PDF de este repositorio; los detalles en
> [Antes de subir un PDF](#antes-de-subir-un-pdf-tapar-datos-personales).

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
public/certs/estudios/cfgs-desarrollo-aplicaciones-multiplataforma.pdf
public/certs/idiomas/trinity-ise-ii-b2.pdf
public/certs/ia/bootcamp-inteligencia-artificial.pdf
public/certs/prl/prl-recurso-preventivo.pdf
```

La carpeta no tiene que existir: créala si hace falta. Cualquier subcarpeta vale,
pero **`pdf` debe apuntar a la ruta correcta dentro de `public/`**.

### 2. Añade la entrada en el JSON

Edita `public/data/certificates.json` y añade un objeto más a la lista:

```json
{
  "id": "prl-consultant",
  "title": "Prevención de Riesgos Laborales — Puesto de Consultant",
  "issuer": "ASPY Prevención",
  "date": "2026-09-25",
  "hours": 2,
  "category": "prl",
  "tags": ["prl", "artículo 19", "consultant", "prevención", "consulta"],
  "pdf": "certs/prl/prl-recurso-preventivo.pdf"
}
```

Listo. No hay que registrar el certificado en ningún otro sitio: la web lo lee
todo del JSON, así que basta con guardar los cambios y hacer `push`.

### Campos del JSON

| Campo | Obligatorio | Descripción |
| --- | --- | --- |
| `id` | No* | Identificador único. Si falta, se genera uno a partir de la posición. Se usa como clave de React, así que **no lo repitas**. |
| `title` | **Sí** | Nombre oficial del título o certificación. |
| `shortTitle` | No | Versión corta para las etiquetas de la trayectoria. Admite un texto único (`"Bootcamp IA"`) o un objeto por idioma (`{ "es": "…", "en": "…" }`). Si no está, la web recorta `title` a 28 caracteres con elipsis. |
| `issuer` | **Sí** | Entidad emisora: universidad, centro, empresa o certificadora. |
| `date` | No | Fecha de emisión. Formatos: `"2025"`, `"2025-03"` o `"2025-03-14"`. Cuantos más campos, más precisa. |
| `hours` | No | Duración en horas. Number o `null`. También acepta `"40"`. Si no lo indicas, no hay barra de horas ni línea de horas. |
| `category` | **Sí** | Clave de sección (ver tabla siguiente). |
| `tags` | No | Etiquetas de búsqueda. **No se muestran en la web**: solo sirven para que el buscador encuentre el certificado. Se normalizan a minúsculas y se ordenan solas. |
| `pdf` | No | Ruta del PDF **relativa a `public/`**, con `/` como separador. Si falta o no existe, el certificado aparece sin botones ni miniatura. |
| `verifyUrl` | No | Enlace público de verificación. Si no lo pones, no se muestra el enlace. |

\* `id` es obligatorio en la práctica: sin él la web genera uno, pero con `id`
explícito el enlace al certificado es estable.

### Secciones

La `category` decide en qué bloque aparece el certificado. El orden de los
bloques es el de `SECTION_ORDER`:

| `category` | Título de la sección (ES / EN) | Carpeta |
| --- | --- | --- |
| `estudios` | Estudios oficiales / Formal studies | `public/certs/estudios/` |
| `ia` | Bootcamp de IA / AI bootcamp | `public/certs/ia/` |
| `idiomas` | Idiomas / Languages | `public/certs/idiomas/` |
| `prl` | PRL / Occupational safety | `public/certs/prl/` |
| `tecnologia` | Tecnología / Technology | `public/certs/tecnologia/` |

**Una sección sin certificados no se muestra**: ni el título ni la navegación.
Por eso `tecnologia` no aparece en la barra de herramientas hasta que haya
algún certificado de esa familia.

**Para añadir una sección nueva** no hace falta tocar la lógica: usa una clave
libre (`salud`, `voluntariado`, …) y aparecerá sola al final, con el nombre de
la clave tal cual. Si quieres que tenga un título propio en los dos idiomas y
una posición concreta, añádela a `SECTION_ORDER` y a `sections` en
`src/i18n/translations.ts`.

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

Si necesitas un PDF de muestra para probar el sitio antes de tener los
documentos reales, puedes generar uno por cada entrada del JSON:

```bash
npm run certs:placeholder                              # solo los que falten
node scripts/generate-placeholder-pdfs.mjs --force      # regenera todos
```

Cada PDF lleva una banda superior de «documento de ejemplo» para que no se
confunda con un certificado auténtico. **Cuando añadas documentos reales, no
uses este script**: los ficheros que genere se llaman como los que ya tengas y
no los sobreescribirá, así que conviene borrar antes los de ejemplo.

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
| Cambiar nombre, rol o el texto del hero | `src/config/site.ts` |
| Cambiar portfolios, perfiles o sus descripciones | `src/config/links.ts` |
| Cambiar textos de la interfaz | `src/i18n/translations.ts` (objetos `es` y `en`) |
| Cambiar colores, tipografías, escala o espaciado | `src/styles/global.css` (bloque `:root` y `[data-theme='light']`) |
| Cambiar el orden de las secciones | `SECTION_ORDER` en `src/utils/certificates.ts` |
| Cambiar los iconos | `src/components/icons.tsx` |

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
│   ├── generate-placeholder-pdfs.mjs
│   ├── check-trajectory.mjs        # geometría de la trayectoria, sin navegador
│   ├── redact-certs.py             # censura los PDF y los renombra
│   ├── inspect-certs.py            # vuelca el texto y avisa de datos sensibles
│   ├── grid-overlay.py             # rejilla de coordenadas para medir cajas
│   └── render-scans.py             # renderiza a PNG para revisar a ojo
├── src/
│   ├── components/                 # interfaz (trayectoria, entradas, modal…)
│   ├── config/site.ts              # ← nombre, rol y presentación
│   ├── config/links.ts             # ← portfolios, perfiles y repositorio
│   ├── context/                    # idioma y tema
│   ├── data/loadCertificates.ts    # descarga, validación y normalización del JSON
│   ├── hooks/                      # carga de datos y scrollspy
│   ├── i18n/translations.ts        # textos ES/EN
│   ├── types/certificate.ts        # forma de un certificado
│   ├── utils/certificates.ts       # secciones, búsqueda y geometría
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/global.css           # ← tokens, escala, rejilla técnica y layout
├── index.html
├── vite.config.ts                  # ← base path de GitHub Pages
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
- **Las secciones se derivan del JSON.** `buildSections` reparte los
  certificados por `category`, les asigna el número de índice (la Trayectoria
  ocupa la 01) y **descarta las que se quedan vacías**, así que una búsqueda
  sin resultados oculta el bloque entero en lugar de dejar un título huérfano.
  Añadir una categoría nueva no requiere tocar código.
- **La trayectoria no se reescala al buscar.** El eje temporal va siempre del
  año más antiguo al más reciente: filtrar atenúa los nodos que no coinciden
  (`opacity: 0.25`) en lugar de redistribuir el eje, que haría saltar la
  pieza principal bajo los dedos.
- **Las fechas se ordenan por número, no por texto**, y se formatean con el
  idioma activo. Por eso cambiar de ES a EN no vuelve a descargar nada.
- **El buscador ignora mayúsculas y acentos:** «redes neuronales» encuentra
  «Redes Neuronales». Varias palabras se combinan con AND.
- **Ninguna ruta empieza por `/`.** En el JSON, `pdf` es relativo a `public/`
  (`certs/...`); el prefijo de GitHub Pages se añade al construir la URL. Así
  el sitio funciona igual en local, en un subdirectorio y en la raíz del
  dominio.

---

## Licencia

Las certificaciones y sus PDF son documentos personales: decide tú bajo qué
licencia publicas el código de este repositorio.