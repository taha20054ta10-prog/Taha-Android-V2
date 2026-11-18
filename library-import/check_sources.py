#!/usr/bin/env python3
"""Check direct PDF candidates without copying or publishing them."""
import json
import urllib.request
from urllib.parse import quote
from pathlib import Path

manifest = json.loads(Path("library-import/manifest.json").read_text(encoding="utf-8"))
results = []
for entry in manifest:
    status = "unverified"
    reason = ""
    try:
        req = urllib.request.Request(quote(entry["url"], safe=":/?&=%+#[]@!$'()*+,;~-._"), headers={"User-Agent": "Mozilla/5.0", "Range": "bytes=0-15"})
        with urllib.request.urlopen(req, timeout=20) as response:
            head = response.read(16)
            status = "pdf_header_confirmed" if head.startswith(b"%PDF-") else "not_pdf"
            reason = f"HTTP {response.status}; content-type={response.headers.get('Content-Type', '')}"
    except Exception as error:
        status, reason = "unreachable", str(error)[:180]
    results.append({"title": entry["title"], "status": status, "detail": reason, "rehosting_approved": entry.get("approved_for_rehosting", False)})
    print(entry["title"], status)
Path("library-import/preflight-report.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
