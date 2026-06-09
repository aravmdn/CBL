"""Pull the large raster evidence images out of the source PDFs into assets/."""
import os, fitz

BASE = r"C:\Users\20243223\OneDrive - TU Eindhoven\Y2 Q4\CBL"
OUT = r"C:\projects\CBL\presentation\assets"
os.makedirs(OUT, exist_ok=True)

TARGETS = {
    "SSA 6 Alice.pdf": "bowl",            # spectra + flowchart + chakra table
    "SSA4_CymaticsPatterns.pdf": "cymatic",
    "SSA report 6 Multi-Disciplinary CBL-1.pdf": "tdnet",
}

manifest = []
for fname, tag in TARGETS.items():
    path = os.path.join(BASE, fname)
    if not os.path.exists(path):
        print("MISSING", path); continue
    doc = fitz.open(path)
    seen = set()
    for pno in range(len(doc)):
        page = doc[pno]
        for img in page.get_images(full=True):
            xref = img[0]
            if xref in seen:
                continue
            seen.add(xref)
            try:
                pix = fitz.Pixmap(doc, xref)
            except Exception as e:
                continue
            if pix.width < 320 or pix.height < 120:
                continue  # skip icons / tiny fragments
            if pix.n - pix.alpha >= 4:       # CMYK -> RGB
                pix = fitz.Pixmap(fitz.csRGB, pix)
            out = os.path.join(OUT, f"{tag}_p{pno+1}_x{xref}_{pix.width}x{pix.height}.png")
            pix.save(out)
            manifest.append((os.path.basename(out), pix.width, pix.height))
    doc.close()

print(f"\nExtracted {len(manifest)} images to {OUT}:")
for name, w, h in sorted(manifest):
    print(f"  {name}  ({w}x{h})")
