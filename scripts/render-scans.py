"""Renderiza a PNG los PDF para poder revisarlos a ojo.

Sirve como comprobacion visual de la censura: un PDF escaneado no tiene capa de
texto, asi que la verificacion automatica NO detecta un DNI que siga visible en
la imagen. Hay que mirar el render.

Uso:  python scripts/render-scans.py
"""

import glob
import os

import pymupdf

OUT = os.path.join(os.environ.get("TEMP", "."), "opencode", "certs-check")
os.makedirs(OUT, exist_ok=True)

for path in sorted(glob.glob(os.path.join("public", "certs", "**", "*.pdf"), recursive=True)):
    doc = pymupdf.open(path)
    slug = os.path.splitext(os.path.basename(path))[0].replace(" ", "-").lower()
    for i, page in enumerate(doc):
        # Escala 2 para que el texto del documento sea legible en la revision.
        pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2))
        out = os.path.join(OUT, f"{slug}-p{i + 1}.png")
        pix.save(out)
        print(f"{out}  ({pix.width}x{pix.height})")
    doc.close()