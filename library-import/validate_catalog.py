#!/usr/bin/env python3
"""Audit Taha Android library source URLs without downloading or republishing PDFs."""
import json, re, urllib.request, urllib.error, time, pathlib, datetime
ROOT=pathlib.Path(__file__).resolve().parents[1]
s=(ROOT/'library.js').read_text(encoding='utf-8')
# Extract the initial JSON literal and each subsequent files.push(...[...]) literal.
# JSONDecoder.raw_decode handles JavaScript lines without semicolons.
decoder=json.JSONDecoder()
arrays=[]
for match in re.finditer(r'(?:const\s+files\s*=|files\.push\(\.\.\.)\s*(?=\[)',s):
 chunk=s[match.end():].lstrip()
 parsed, consumed=decoder.raw_decode(chunk)
 if not isinstance(parsed,list): raise ValueError('Expected array at '+str(match.start()))
 arrays.append(parsed)
items=[]
for chunk in arrays:
 items.extend(chunk)
if not items: raise RuntimeError('No catalog entries parsed: aborting empty audit')
results=[]
for i,f in enumerate(items):
 u=f.get('url','')
 row={k:f.get(k) for k in ('grade','type','title','url')}
 row['status']='unchecked'
 if not u.startswith('https://'):
  row['status']='invalid_url';results.append(row);continue
 try:
  req=urllib.request.Request(u,method='GET',headers={'User-Agent':'Mozilla/5.0 (TahaAndroidLibraryAudit/1.0)','Range':'bytes=0-2047'})
  with urllib.request.urlopen(req,timeout=18) as resp:
   ct=resp.headers.get('Content-Type','').lower()
   data=resp.read(2048)
   row['http_status']=resp.status
   row['content_type']=ct
   row['status']='pdf_header_verified' if data.startswith(b'%PDF-') else ('source_page_reachable' if f.get('externalSource') else ('viewer_page_reachable' if 'drive.google.com' in u and 'html' in ct else 'unexpected_non_pdf'))
 except urllib.error.HTTPError as exc:
  row['http_status']=exc.code;row['status']='http_error'
 except Exception as exc:
  row['status']='network_error';row['error']=str(exc)[:160]
 results.append(row)
 if i%25==0: print('Checked',i+1,'of',len(items),flush=True)
summary={'audit_note':'PDF header checks verify file type only, not full download or content accuracy','checked_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'total':len(results),'statuses':{x:sum(r['status']==x for r in results) for x in sorted({r['status'] for r in results})},'by_grade':{str(g):sum(r.get('grade')==str(g) for r in results) for g in range(1,16)}}
out=ROOT/'library-import';out.mkdir(exist_ok=True)
(out/'audit-report.json').write_text(json.dumps({'summary':summary,'entries':results},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))
