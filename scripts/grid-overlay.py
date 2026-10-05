"""Dibuja una rejilla de coordenadas sobre los PDF originales para poder medir
con precision donde empieza y acaba cada dato que hay que censurar."""

import os
import sys

import pymupdf

OUT = os.path.join(os.environ["TEMP"], "opencode", "certs-grid")
os.makedirs(OUT, exist_ok=True)

ORIGINALES = os.path.join(os.environ["TEMP"], "opencode", "certs-originales")

DOCS = [
    (os.path.join(ORIGINALES, "certs__estudios__CFGS - Desarrollo de Aplicaciones Multiplataforma.pdf"), "cfgs"),
    (os.path.join(ORIGINALES, "certs__estudios__CFGM - Instalaciones de Telecomunicaciones.pdf"), "cfgm"),
    (os.path.join(ORIGINALES, "certs__estudios__Titulación ESO.pdf"), "eso"),
    (os.path.join(ORIGINALES, "certs__idiomas__Certificado B2 Inglés.pdf"), "trinity"),
]

TARGET_WIDTH = 1700

for path, slug in DOCS:
    doc = pymupdf.open(path)
    page = doc[0]
    w, h = page.rect.width, page.rect.height

    shape = page.new_shape()
    # Rejilla vertical cada 5 %
    for i in range(0, 21):
        x = w * i / 20
        shape.draw_line(pymupdf.Point(x, 0), pymupdf.Point(x, h))
        shape.finish(color=(0, 0.5, 1), width=0.6)
        shape.insert_text(pymupdf.Point(x + 2, 14), f"{i*5}", fontsize=11, color=(0, 0.35, 0.9))
    # Rejilla horizontal cada 5 %
    for i in range(0, 21):
        y = h * i / 20
        shape.draw_line(pymupdf.Point(0, y), pymupdf.Point(w, y))
        shape.finish(color=(0, 0.5, 1), width=0.6)
        shape.insert_text(pymupdf.Point(3, y - 3), f"{i*5}", fontsize=11, color=(0, 0.35, 0.9))
    # Lineas finas cada 1 % para afinar
    for i in range(0, 101):
        if i % 5:
            x = w * i / 100
            shape.draw_line(pymupdf.Point(x, 0), pymupdf.Point(x, h))
            shape.finish(color=(0.75, 0.85, 1), width=0.3)
    shape.commit()

    scale = TARGET_WIDTH / w
    pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))
    out = os.path.join(OUT, f"{slug}.png")
    pix.save(out)
    print(f"{out}  {pix.width}x{pix.height}  (pagina {w:.0f}x{h:.0f}pt, escala {scale:.4f})")
    doc.close()