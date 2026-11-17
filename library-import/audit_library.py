#!/usr/bin/env python3
"""Audit all linked school PDFs without downloading or republishing their contents."""
import json, re, urllib.request, urllib.error
from pathlib import Path

src=Path("library.js").read_text(encoding="utf-8")
match=re.search(r"const files=(\[.*?\])\s*\n\s*let type=",src,re.S)
if not match: raise SystemExit("Could not locate library.js file list")
files=json.loads(match.group(1))
results=[]
for i,f in enumerate(files,1):
    url=f["url"]
    drive=re.search(r"drive\.google\.com/file/d/([^/]+)/preview",url)
    test_url=("https://drive.google.com/file/d/"+drive.group(1)+"/view") if drive else url
    status="unverified"; detail=""
    try:
        req=urllib.request.Request(test_url,headers={"User-Agent":"Mozilla/5.0","Range":"bytes=0-15"})
        with urllib.request.urlopen(req,timeout=12) as res:
            head=res.read(16)
            if drive:
                status="drive_page_reachable_not_pdf_verified"
            else:
                status="pdf_header_confirmed" if head.startswith(b"%PDF-") else "response_not_pdf"
            detail=f"HTTP {res.status}; {res.headers.get('Content-Type','')}"
    except Exception as e:
        status="unreachable";detail=str(e)[:180]
    results.append({**f,"status":status,"detail":detail})
    print(f"[{i}/{len(files)}] {status}: {f['title']}",flush=True)
out=Path("library-import/all-links-report.json")
out.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
print("Totals:",json.dumps({s:sum(x["status"]==s for x in results) for s in set(x["status"] for x in results)}))
