from __future__ import annotations

import json
import sys
from pathlib import Path

import pymupdf
from openpyxl import load_workbook


def inspect_pdf(path: Path, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(path)
    pages = []
    for page_index, page in enumerate(doc):
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.8, 1.8), alpha=False)
        render_path = out_dir / f"sample-page-{page_index + 1}.png"
        pix.save(render_path)
        images = []
        for image_index, image in enumerate(page.get_images(full=True)):
            xref = image[0]
            info = doc.extract_image(xref)
            image_path = out_dir / f"sample-p{page_index + 1}-img{image_index + 1}.{info['ext']}"
            image_path.write_bytes(info["image"])
            images.append({"path": str(image_path), "width": info["width"], "height": info["height"]})
        pages.append(
            {
                "page": page_index + 1,
                "size": [page.rect.width, page.rect.height],
                "text": page.get_text("text"),
                "render": str(render_path),
                "images": images,
            }
        )
    return {"metadata": doc.metadata, "pages": pages}


def inspect_xlsx(path: Path) -> dict:
    wb_values = load_workbook(path, data_only=True)
    wb_formulas = load_workbook(path, data_only=False)
    sheets = []
    for ws_values in wb_values.worksheets:
        ws_formulas = wb_formulas[ws_values.title]
        cells = []
        for row in ws_values.iter_rows():
            for cell in row:
                if cell.value is None:
                    continue
                formula = ws_formulas[cell.coordinate].value
                cells.append(
                    {
                        "cell": cell.coordinate,
                        "value": cell.value.isoformat() if hasattr(cell.value, "isoformat") else cell.value,
                        "formula": formula if isinstance(formula, str) and formula.startswith("=") else None,
                        "number_format": cell.number_format,
                    }
                )
        images = []
        for image_index, image in enumerate(getattr(ws_values, "_images", [])):
            images.append(
                {
                    "index": image_index + 1,
                    "width": image.width,
                    "height": image.height,
                    "anchor": getattr(getattr(image, "anchor", None), "_from", None).__dict__
                    if hasattr(getattr(image, "anchor", None), "_from")
                    else None,
                }
            )
        sheets.append(
            {
                "title": ws_values.title,
                "dimensions": ws_values.calculate_dimension(),
                "merged_cells": [str(rng) for rng in ws_values.merged_cells.ranges],
                "cells": cells,
                "images": images,
                "print_area": str(ws_values.print_area) if ws_values.print_area else None,
            }
        )
    return {"sheets": sheets}


def main() -> None:
    pdf_path = Path(sys.argv[1])
    xlsx_path = Path(sys.argv[2])
    out_dir = Path(sys.argv[3])
    result = {"pdf": inspect_pdf(pdf_path, out_dir), "xlsx": inspect_xlsx(xlsx_path)}
    print(json.dumps(result, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
