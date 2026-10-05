"""
Censura los datos personales de los PDF de public/certs y los renombra.

Los PDF de texto se censuran con PyMuPDF, que BORRA los glifos del flujo de
contenido (redaccion real: el texto no se puede recuperar ni Selecting).

Los PDF escaneados son imagenes rasterizadas: un rectangulo negro dibujado
encima se puedeoda "quitar" recuperando la imagen original. Por eso aqui se
rasteriza la pagina, se pintan los pixeles y se reconstruye el PDF a partir de
la imagen ya modificada. El contenido original deja de estar en el fichero.

Uso:  python scripts/redact-certs.py
"""

import glob
import os
import re
import shutil
import sys

import pymupdf

# --- Origen de los ficheros, sin renombrar todavia ----------------------------
ORIGIN = {
    "certs/estudios/CFGS - Desarrollo de Aplicaciones Multiplataforma.pdf":
        "certs/estudios/cfgs-desarrollo-aplicaciones-multiplataforma.pdf",
    "certs/estudios/CFGM - Instalaciones de Telecomunicaciones.pdf":
        "certs/estudios/cfgm-instalaciones-telecomunicaciones.pdf",
    "certs/estudios/Titulación ESO.pdf":
        "certs/estudios/eso-titulo-graduado.pdf",
    "certs/ia/Bootcamp AI-Mario-Muñoz-Pequeño.pdf":
        "certs/ia/bootcamp-inteligencia-artificial.pdf",
    "certs/idiomas/Certificado B2 Inglés.pdf":
        "certs/idiomas/trinity-ise-ii-b2.pdf",
    "certs/PRL.pdf": "certs/prl/prl-recurso-preventivo.pdf",
    "certs/Health and safety during telework.pdf":
        "certs/prl/health-and-safety-during-teleworking.pdf",
}

PUBLIC = os.path.join("public")
BACKUP = os.path.join(os.environ["TEMP"], "opencode", "certs-originales")

# --- Datos a censurar ---------------------------------------------------------
# DNI/NIE, tal cual aparece (con o sin separador).
DNI = "71190158Y"

# Cadenas que jamas deben quedar en el fichero publicado.
SECRETS = [
    DNI,
    "MNQPMR200149BF01",   # CIE del CFGS
    "MNQPMR200149BF01".replace("N", "N"),  # variante con tilde en CFGM
    "201913283357",       # Registro Central de Titulos (ESO)
    "071813039604",       # Registro Autonomico de Titulos (ESO)
    "CyL-A-816021",       # codigo de titulo (ESO)
    "1-10550896455",      # candidate number (Trinity)
    "10538964962",        # el mismo numero suelto, aparece en los metadatos
    "FP0384920",
    "FP0367855",
    "27 de noviembre de 2001",
]

# Cajas de los PDF escaneados, en fracciones de ancho y alto de la pagina
# (0-1). Medidas sobre una rejilla de coordenadas superpuesta al original con
# `grid-overlay.py`; verificar visualmente despues de aplicar, porque la
# comprobacion automatica NO detecta texto dentro de una imagen.
SCANNED_BOXES = {
    "certs/estudios/CFGS - Desarrollo de Aplicaciones Multiplataforma.pdf": [
        # "DNI/NIE  71190158Y"  (entre el nombre y "matriculado en el Ciclo...")
        (0.315, 0.278, 0.418, 0.303),
        # "CIE:  MNQPMR200149BF01" (llega hasta el margen derecho)
        (0.786, 0.256, 0.990, 0.279),
        # "FP0384920", referencia de documento abajo a la izquierda
        (0.030, 0.930, 0.145, 0.960),
    ],
    "certs/estudios/CFGM - Instalaciones de Telecomunicaciones.pdf": [
        # "DNI/NIE  71190158Y"
        (0.325, 0.262, 0.418, 0.285),
        # "CIE:  MNQPMR200149BF01"
        (0.788, 0.237, 0.990, 0.262),
        # "FP0367855"
        (0.030, 0.927, 0.145, 0.962),
    ],
    "certs/estudios/Titulación ESO.pdf": [
        # "nacido el dia 27 de noviembre de 2001 ... con DNI 71190158Y,"
        (0.222, 0.472, 0.775, 0.500),
        # "CyL-A-816021"
        (0.145, 0.860, 0.275, 0.885),
        # "Registro Central de Titulos 201913283357"
        (0.300, 0.860, 0.400, 0.885),
        # "071813039604" y el codigo de barras que lo codifica
        (0.435, 0.858, 0.545, 0.900),
    ],
    "certs/idiomas/Certificado B2 Inglés.pdf": [
        # "Candidate number: 1-10550896455"
        (0.555, 0.088, 0.925, 0.106),
    ],
}

WHITE = (1, 1, 1)


def log(msg):
    print(msg)


def has_text_layer(path):
    doc = pymupdf.open(path)
    try:
        return any(page.get_text().strip() for page in doc)
    finally:
        doc.close()


def scrub_metadata(doc):
    """Los metadatos tambien filtran datos: se limpian en todos los ficheros."""
    doc.set_metadata({
        "title": "",
        "author": "",
        "subject": "",
        "keywords": "",
        "creator": "",
        "producer": "",
    })
    doc.del_xml_metadata()


def redact_text_pdf(src, dst, targets):
    """Redaccion real: PyMuPDF elimina los glfos de los flujos de contenido."""
    doc = pymupdf.open(src)
    found = {t: 0 for t in targets}

    for page in doc:
        for target in targets:
            # search_for encuentra cada aparicion, respetando el sentido de
            # lectura;asi el rectangulo cubre el texto real.
            rects = page.search_for(target)
            for rect in rects:
                # Un pequeño margen evita que queden bordes de los glifos.
                redact_rect = pymupdf.Rect(rect) + (-1.5, -1.5, 1.5, 1.5)
                page.add_redact_annot(redact_rect, fill=WHITE)
                found[target] += 1

    for page in doc:
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE)

    scrub_metadata(doc)
    doc.save(dst, garbage=4, deflate=True, clean=True)
    doc.close()
    return found


def redact_scanned_pdf(src, dst, boxes):
    """Para rasters: se rasteriza, se pintan los pixeles y se reconstruye."""
    doc = pymupdf.open(src)
    out = pymupdf.open()
    painted = 0

    for index, page in enumerate(doc):
        rect = page.rect
        # Escala 1.5: las paginas de estos escaneados son enormes (unos 3000 pt),
        # asi que renderizar a mas resolucion solo multiplicaria el peso. A 1.5
        # el texto sigue nitido y el fichero se mantiene manejable.
        scale = 1.5
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))

        # Se trabaja siempre en RGB: en otros espacios de color (CMYK, Separación)
        # el byte 255 no significaría "blanco".
        if pix.colorspace is None or pix.colorspace.n != 3 or pix.alpha:
            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)

        page_boxes = boxes[index] if index < len(boxes) else []
        if page_boxes:
            # `samples` se devuelve como bytes inmutables: se trabaja sobre una
            # copia mutable y se reasigna al final.
            buffer = bytearray(pix.samples)
            n = pix.n
            stride = pix.stride

            for (fx0, fy0, fx1, fy1) in page_boxes:
                x0 = max(0, min(pix.width - 1, int(fx0 * pix.width)))
                y0 = max(0, min(pix.height - 1, int(fy0 * pix.height)))
                x1 = max(x0 + 1, min(pix.width, int(fx1 * pix.width)))
                y1 = max(y0 + 1, min(pix.height, int(fy1 * pix.height)))

                white = b"\xff" * n
                for y in range(y0, y1):
                    base = y * stride
                    buffer[base + x0 * n : base + x1 * n] = white * (x1 - x0)
                painted += 1

            pix = pymupdf.Pixmap(pymupdf.csRGB, pix.width, pix.height, bytes(buffer), False)

        # JPEG: los escaneos son imagenes fotograficas, donde comprimir sin
        # perdida visible ahorra mucho peso frente a PNG. Los ficheros originales
        # rondaban los 300 KB; a PNG pasaban a 10 MB.
        jpeg = pix.tobytes("jpeg", jpg_quality=85)
        new_page = out.new_page(width=rect.width, height=rect.height)
        new_page.insert_image(new_page.rect, stream=jpeg)

    scrub_metadata(out)
    out.save(dst, garbage=4, deflate=True)
    out.close()
    doc.close()
    return painted


def verify(path):
    """Comprueba que ningun dato sensible sobrevive en el texto, en los
    metadatos o en los bytes crudos del fichero.

    ATENCION: esto NO detecta texto dibujado dentro de una imagen rasterizada
    (los escaneados). Para esos hace falta revisar la imagen a ojo: ejecuta
    `render-scans.py` sobre los PDF ya censurados y mira las paginas.
    """
    problems = []

    doc = pymupdf.open(path)
    raw_text = "\n".join(page.get_text() for page in doc)
    meta = doc.metadata or {}
    doc.close()

    haystack = raw_text + "\n" + "\n".join(str(v) for v in meta.values())

    with open(path, "rb") as handle:
        blob = handle.read()

    for secret in SECRETS:
        if secret in haystack:
            problems.append(f"texto/metadatos: {secret}")
        if secret.encode("latin-1", "ignore") in blob:
            problems.append(f"bytes del fichero: {secret}")

    return problems


def main():
    os.makedirs(BACKUP, exist_ok=True)
    log(f"Copia de seguridad de los originales en: {BACKUP}\n")

    # Se Localiza cada PDF por el nombre de origen dentro de public/.
    index = {}
    for path in glob.glob(os.path.join(PUBLIC, "**", "*.pdf"), recursive=True):
        rel = os.path.relpath(path, PUBLIC).replace("\\", "/")
        index[rel] = path

    # 1) Copia de seguridad
    for rel, path in index.items():
        shutil.copy2(path, os.path.join(BACKUP, rel.replace("/", "__")))

    # 2) Censura + renombrado
    results = []
    for src_rel, dst_rel in ORIGIN.items():
        src = index.get(src_rel)
        if not src:
            log(f"  ! No encontrado: {src_rel}")
            continue

        dst = os.path.join(PUBLIC, dst_rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)

        if has_text_layer(src):
            # El DNI es lo que hay que quitar; en el titulo del bootcamp
            # aparece pegado al numero de registro propio de UNIR.
            targets = [DNI]
            found = redact_text_pdf(src, dst, targets)
            log(f"  redactado (texto) {dst_rel}  ->  {found}")
        else:
            boxes = SCANNED_BOXES.get(src_rel, [])
            count = redact_scanned_pdf(src, dst, [boxes] if boxes else [])
            log(f"  redactado (raster) {dst_rel}  ->  {count} zona(s)")

        results.append(dst_rel)

    # 3) Comprobacion
    log("\nVerificacion automatica (texto, metadatos y bytes):")
    failed = False
    for rel in sorted(results):
        dst = os.path.join(PUBLIC, rel)
        problems = verify(dst)
        if problems:
            failed = True
            log(f"  FALLA {rel}")
            for problem in problems:
                log(f"        sigue presente -> {problem}")
        else:
            log(f"  OK    {rel}")

    log(
        "\nREVISION VISUAL PENDIENTE (obligatoria para los escaneados):\n"
        "  python scripts/render-scans.py   y abrir las imagenes de\n"
        "  %TEMP%\\opencode\\certs-check\\\n"
        "  Los PDF con imagen rasterizada no se pueden comprobar por texto:\n"
        "  - certs/estudios/cfgs-desarrollo-aplicaciones-multiplataforma.pdf\n"
        "  - certs/estudios/cfgm-instalaciones-telecomunicaciones.pdf\n"
        "  - certs/estudios/eso-titulo-graduado.pdf\n"
        "  - certs/idiomas/trinity-ise-ii-b2.pdf"
    )

    # 4) Borrado de los ficheros originales (ya estan en la copia de seguridad)
    log("\nRetirando los ficheros con el nombre original:")
    for rel, path in index.items():
        if rel in ORIGIN:
            os.remove(path)
            log(f"  - {rel}")

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())