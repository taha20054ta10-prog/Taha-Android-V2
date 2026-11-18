#!/usr/bin/env python3
"""Validate catalog structure and check public responses with bounded reads."""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html import unescape
import json
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from catalog import ROOT, load_catalog


def canonical(url):
    parsed = urlsplit(url)
    return urlunsplit(parsed._replace(path=unquote(parsed.path).rstrip("/")))


def validate(entries):
    seen = set()
    for entry in entries:
        url = urlsplit(entry["url"])
        key = (entry["grade"], entry["type"], canonical(entry["url"]))
        if (
            url.scheme != "https" or not url.hostname or url.username or url.password
            or entry["grade"] not in {str(grade) for grade in range(1, 16)}
            or entry["type"] not in {"book", "notes", "exams"}
            or entry["format"] not in {"pdf", "drive", "viewer", "source"}
            or not entry["title"].strip() or not entry["subject"]
        ):
            raise ValueError(f"Invalid catalog entry: {entry}")
        if entry.get("cover") and not (ROOT / entry["cover"]).is_file():
            raise ValueError(f"Missing cover: {entry['cover']}")
        if not entry.get("archived"):
            if key in seen:
                raise ValueError(f"Duplicate active link within a grade and section: {key}")
            seen.add(key)
    sitemap = ElementTree.parse(ROOT / "sitemap.xml")
    for node in sitemap.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
        path = urlsplit(node.text).path.removeprefix("/Taha-Android-V2/") or "index.html"
        if not (ROOT / path).is_file():
            raise ValueError(f"Sitemap references a missing page: {node.text}")


def request(url, limit, ranged=False):
    headers = {"User-Agent": "Mozilla/5.0 (TahaAndroidLibraryAudit)"}
    if ranged:
        headers["Range"] = f"bytes=0-{limit - 1}"
    url = quote(url, safe=":/?&=%+#[]@!$'()*+,;~-._")
    try:
        with urlopen(Request(url, headers=headers), timeout=12) as response:
            return response.status, response.geturl(), response.headers.get_content_type(), response.read(limit)
    except HTTPError as error:
        return error.code, error.geturl(), "", b""
    except (URLError, OSError, ValueError):
        return None, url, "", b""


def audit(entry):
    fmt = entry["format"]
    url = entry["url"]
    code, final, content_type, body = request(url, 2048 if fmt == "pdf" else 32768, fmt == "pdf")
    match = re.search(rb"<title[^>]*>(.*?)</title>", body, re.IGNORECASE | re.DOTALL)
    title = unescape(match[1].decode("utf-8", errors="replace")).strip() if match else ""
    result = {**entry, "http_status": code, "final_url": final, "content_type": content_type, "page_title": title}
    if code not in (200, 206):
        status = "http_error" if code is not None else "network_error"
    elif body.startswith(b"%PDF-"):
        status = "pdf_header"
    elif fmt in {"drive", "viewer"}:
        drive = re.fullmatch(r"/file/d/([\w-]+)/preview", urlsplit(url).path)
        if urlsplit(final).hostname != "drive.google.com" or not drive:
            status = "unexpected_redirect"
        else:
            query = urlencode({"id": drive[1], "export": "download", "confirm": "t"})
            download_status, _, _, prefix = request(
                f"https://drive.usercontent.google.com/download?{query}", 2048, True
            )
            result["download_http_status"] = download_status
            status = "drive_pdf_header" if prefix.startswith(b"%PDF-") else "viewer_unverified"
    elif fmt == "source" and content_type == "text/html" and title:
        status = "source_page" if canonical(url) == canonical(final) else "source_redirect"
    else:
        status = "unexpected_non_pdf"
    return {**result, "status": status}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--offline", action="store_true", help="validate local catalog and sitemap only")
    parser.add_argument("--output", type=Path, default=ROOT / "library-import/audit-report.json")
    args = parser.parse_args()
    entries = load_catalog()
    validate(entries)
    if args.offline:
        print(f"Validated {len(entries)} catalog entries and sitemap paths")
        return
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(audit, entries))
    summary = {
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "total": len(results),
        "statuses": dict(Counter(row["status"] for row in results)),
        "audit_note": "A PDF signature or source page is evidence of reachability and format only.",
    }
    args.output.write_text(json.dumps({"summary": summary, "entries": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
