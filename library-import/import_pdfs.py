#!/usr/bin/env python3
"""Download explicitly approved PDFs and store in Taha Android Library Supabase Storage."""
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BUCKET = "school-pdfs"
PROJECT = "vzshvcvbhnvvpvarmzbq"
BASE = "https://" + PROJECT + ".supabase.co"
MANIFEST = Path("library-import/manifest.json")
REPORT = Path("library-import/report.json")
MAX_BYTES = 50 * 1024 * 1024

def request(url, data=None, headers=None, method=None, timeout=80):
    return urllib.request.urlopen(urllib.request.Request(
        url, data=data, headers=headers or {}, method=method
    ), timeout=timeout)

def main():
    key = os.environ.get("SUPABASE_STORAGE_SECRET", "").strip()
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ValueError("Manifest must be an array")
    report = []
    if not key:
        print("SUPABASE_STORAGE_SECRET missing; no uploads attempted.")
        return 2
    for entry in entries:
        name = str(entry.get("title", "untitled"))
        result = {"title": name, "status": "skipped"}
        try:
            if entry.get("approved_for_rehosting") is not True:
                result["reason"] = "rehosting permission not confirmed"
                continue
            url = entry["url"]
            parsed = urllib.parse.urlparse(url)
            if parsed.scheme != "https" or not parsed.hostname or parsed.hostname in ("localhost",):
                raise ValueError("Only HTTPS public sources allowed")
            grade = str(entry["grade"])
            kind = str(entry["type"])
            if grade not in {str(n) for n in range(1, 16)} or kind not in ("book", "notes", "exams"):
                raise ValueError("Invalid grade/type")
            if not re.fullmatch(r"[a-zA-Z0-9_-]{2,90}", str(entry["slug"])):
                raise ValueError("Slug must be ASCII letters/numbers/hyphens")
            path = f"{grade}/{kind}/{entry['slug']}.pdf"
            with request(url, headers={"User-Agent": "TahaAndroidLibrary/1.0"}) as response:
                content_type = response.headers.get("Content-Type", "").lower()
                if "text/html" in content_type:
                    raise ValueError("Source is an HTML page, not PDF")
                data = response.read(MAX_BYTES + 1)
            if len(data) > MAX_BYTES or not data.startswith(b"%PDF-") or b"%%EOF" not in data[-4096:]:
                raise ValueError("Not a complete PDF or exceeds 50 MiB")
            upload_url = BASE + "/storage/v1/object/" + BUCKET + "/" + urllib.parse.quote(path)
            headers = {
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/pdf",
                "x-upsert": "false",
            }
            try:
                with request(upload_url, data=data, headers=headers, method="POST") as response:
                    response.read()
                result["status"] = "uploaded"
            except urllib.error.HTTPError as exc:
                if exc.code == 409:
                    result["status"] = "already_exists"
                else:
                    raise ValueError(f"Storage HTTP {exc.code}") from exc
            result["public_url"] = BASE + "/storage/v1/object/public/" + BUCKET + "/" + urllib.parse.quote(path)
            result["sha256"] = hashlib.sha256(data).hexdigest()
            result["grade"] = grade
            result["type"] = kind
        except Exception as exc:
            result["status"] = "error"
            result["reason"] = str(exc)[:200]
        finally:
            report.append(result)
            print(name + ": " + result["status"])
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    return 1 if any(r["status"] == "error" for r in report) else 0

if __name__ == "__main__":
    sys.exit(main())
