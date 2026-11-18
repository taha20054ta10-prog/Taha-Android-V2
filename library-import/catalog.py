"""Read the catalog used by the public library."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_catalog():
    source = (ROOT / "library-data.js").read_text(encoding="utf-8")
    marker = "const libraryCatalog ="
    if marker not in source:
        raise ValueError("Missing libraryCatalog data")
    entries, _ = json.JSONDecoder().raw_decode(source.split(marker, 1)[1].lstrip())
    if not isinstance(entries, list) or not entries:
        raise ValueError("Catalog must contain entries")
    return entries
