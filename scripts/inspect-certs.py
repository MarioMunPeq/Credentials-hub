import glob
import os
import sys

import pymupdf

# Spanish ID patterns + anything that looks like a personal identifier.
PATTERNS = [
    ("DNI", r"\b\d{8}\s?[-–]?\s?[A-HJ-NP-TV-Z]\b"),
    ("NIE", r"\b[X-Z]\s?-?\d{7}\s?[-–]?\s?[A-HJ-NP-TV-Z]\b"),
    ("NIF/NIE compuesto", r"\b[X-Z]\d{6,7}\s?[-–]?\s?[A-HJ-NP-TV-Z]\b"),
    ("registro", r"(?i)\b(n[ºo°]?\.?\s?(de\s)?(registro|expediente|registro\s?c)|registro\s?n[ºo°]?\s*:?\s*\d{4,})"),
    ("fecha nacimiento", r"(?i)\bfecha\s+de\s+nacimiento\b"),
    ("telefono", r"\b(?:\+?\d{1,3}[\s.-]?)?[6-9]\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b"),
]

files = sorted(glob.glob("public/certs/**/*.pdf", recursive=True))

for path in files:
    doc = pymupdf.open(path)
    print("=" * 78)
    print(f"{os.path.basename(path)}")
    print(f"  paginas={doc.page_count}  metadata={ {k: v for k, v in doc.metadata.items() if v and k in ('author','creator','producer','title','subject','keywords','creationDate','modDate')} }")
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        images = page.get_images(full=True)
        print(f"  --- pagina {i+1}: {len(text)} chars de texto, {len(images)} imagen(es), {page.rect.width:.0f}x{page.rect.height:.0f}pt")
        if text:
            print("      TEXTO:")
            for line in text.splitlines():
                line = line.strip()
                if line:
                    print(f"        | {line}")
        if not text and images:
            print("      (sin capa de texto: documento escaneado)")
    doc.close()