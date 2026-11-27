"""Improve existing educational HTML in place; no downloads or generated lessons."""
import html, re, json, posixpath
from pathlib import Path
from collections import defaultdict, Counter
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE="https://taha20054ta10-prog.github.io/Taha-Android-V2/"
NS="http://www.sitemaps.org/schemas/sitemap/0.9"
sitemap=ROOT/"sitemap.xml"
xml=sitemap.read_text(encoding="utf-8")
root=ET.fromstring(xml)
all_urls=[n.text for n in root.findall(f"{{{NS}}}url/{{{NS}}}loc")]
assert len(all_urls)==len(set(all_urls))
paths={unquote(u[len(BASE):]) or "index.html" for u in all_urls if u.startswith(BASE)}
assert len(paths)==len(all_urls) and all((ROOT/p).is_file() for p in paths)
ref_re=re.compile(r"^(books|mlazim)/(\d\d)-([a-z]+)-[^/]+\.html$")
study_re=re.compile(r"^study-(one|two|three|four|five|six)-(primary|middle|scientific|literary)-([a-z]+)\.html$")
grade_re=re.compile(r"^grade-(one|two|three)-(math|science|english|reading|islamic|ethics)\.html$")
grade_codes={("one","primary"):"01",("two","primary"):"02",("three","primary"):"03",("four","primary"):"04",("five","primary"):"05",("six","primary"):"06",("one","middle"):"07",("two","middle"):"08",("three","middle"):"09",("four","scientific"):"10",("five","scientific"):"11",("six","scientific"):"12",("four","literary"):"13",("five","literary"):"14",("six","literary"):"15"}
grade_names={"01":"الأول الابتدائي","02":"الثاني الابتدائي","03":"الثالث الابتدائي","04":"الرابع الابتدائي","05":"الخامس الابتدائي","06":"السادس الابتدائي","07":"الأول المتوسط","08":"الثاني المتوسط","09":"الثالث المتوسط","10":"الرابع العلمي","11":"الخامس العلمي","12":"السادس العلمي","13":"الرابع الأدبي","14":"الخامس الأدبي","15":"السادس الأدبي"}
def clean(t):
    return re.sub(r"\s+"," ",html.unescape(re.sub(r"<[^>]+>","",t or ""))).strip()
def normalize(t):
    return re.sub(r"\s+"," ",t.replace("الإعدادي ","").replace("الاعدادي ","").replace("إعدادي ","").translate(str.maketrans("أإآى","اااي"))).strip()
def alias(s): return "arabic" if s=="reading" else s
def key(p):
    if m:=ref_re.fullmatch(p): return (m[2],alias(m[3]))
    if m:=study_re.fullmatch(p): return (grade_codes[(m[1],m[2])],alias(m[3]))
    if m:=grade_re.fullmatch(p): return (grade_codes[(m[1],"primary")],alias(m[2]))
def tag_text(c,tag):
    m=re.search(r"<"+tag+r"\b[^>]*>(.*?)</"+tag+r">",c,re.I|re.S)
    return clean(m[1]) if m else ""
def get_meta(c):
    m=re.search(r'<meta\b[^>]*\bname=["\x27]description["\x27][^>]*>',c,re.I)
    if not m: return ""
    v=re.search(r'\bcontent=(["\x27])(.*?)\1',m[0],re.I|re.S)
    return clean(v[2]) if v else ""
def get_links(p,c):
    out=set()
    for m in re.finditer(r'<a\b[^>]*\bhref=(["\x27])(.*?)\1',c,re.I|re.S):
        h=html.unescape(m[2]); u=urlsplit(h)
        if u.scheme or u.netloc:
            if h.startswith(BASE): out.add(unquote(urlsplit(h[len(BASE):]).path))
            continue
        if not u.path: continue
        out.add(posixpath.normpath(posixpath.join(posixpath.dirname(p),unquote(u.path))))
    return out
def grade_label(c):
    m=re.search(r"<dt>الصف الدراسي</dt>\s*<dd>(.*?)</dd>",c,re.S)
    if not m:m=re.search(r"<li>المرحلة:\s*(.*?)</li>",c,re.S)
    return clean(m[1]) if m else ""
def subject_label(c):
    m=re.search(r"<dt>المادة</dt>\s*<dd>(.*?)</dd>",c,re.S)
    if not m:m=re.search(r"<li>المادة:\s*(.*?)</li>",c,re.S)
    return clean(m[1]) if m else ""
def source_label(c):
    m=re.search(r"<dt>الرابط</dt>\s*<dd>(.*?)</dd>",c,re.S)
    if not m:m=re.search(r"<li>نوع الرابط:\s*(.*?)</li>",c,re.S)
    s=clean(m[1]) if m else ""
    if "PDF مباشر" in s and "ليست" not in s and "ليس" not in s: return "رابط PDF لدى المصدر الخارجي"
    if "Drive" in s: return "ملف أو معاينة Google Drive لدى المصدر"
    if "ناشر" in s or "خارجي" in s: return "رابط صفحة المصدر الخارجي"
    return s or "رابط المصدر المدرج"
def short(s,n=155):
    if len(s)<=n:return s
    x=s[:n-1].rsplit(" ",1)[0]
    return (x or s[:n-1])+"…"
def esc(s):return html.escape(s,quote=True)
def metadata(c,title,desc):
    m=re.search(r"<head\b[^>]*>.*?</head>",c,re.I|re.S)
    assert m, "missing head"
    h=m[0]
    t=r"<title\b[^>]*>.*?</title>"
    d=r'<meta\b[^>]*\bname=["\x27]description["\x27][^>]*>'
    assert len(re.findall(t,h,re.I|re.S))==1 and len(re.findall(d,h,re.I|re.S))==1
    h=re.sub(t,lambda _:f"<title>{esc(title)}</title>",h,flags=re.I|re.S)
    h=re.sub(d,lambda _:f'<meta name="description" content="{esc(desc)}">',h,flags=re.I|re.S)
    for prop,val in (("og:title",title),("og:description",desc),("twitter:title",title),("twitter:description",desc)):
        pat=r'<meta\b[^>]*(?:property|name)=["\x27]'+re.escape(prop)+r'["\x27][^>]*>'
        h=re.sub(pat,lambda m:re.sub(r'\bcontent=(["\x27])(.*?)\1',lambda _:f'content="{esc(val)}"',m[0],flags=re.I|re.S),h,flags=re.I|re.S)
    def ld(m):
        try:o=json.loads(m[2])
        except (ValueError,TypeError):return m[0]
        if not isinstance(o,dict) or o.get("@type")!="WebPage":return m[0]
        o["description"]=desc
        return m[1]+json.dumps(o,ensure_ascii=False,separators=(",",":")).replace("</","<\\/")+"</script>"
    h=re.sub(r'(<script\b[^>]*type=["\x27]application/ld\+json["\x27][^>]*>)(.*?)</script>',ld,h,flags=re.I|re.S)
    return c[:m.start()]+h+c[m.end():]

docs={p:(ROOT/p).read_text(encoding="utf-8") for p in sorted(paths) if key(p)}
refs={p:c for p,c in docs.items() if ref_re.fullmatch(p)}
studies={p:c for p,c in docs.items() if not ref_re.fullmatch(p)}
assert len(refs)==226 and len(studies)==109, (len(refs),len(studies))
by_key=defaultdict(list)
study_by_key=defaultdict(list)
for p,c in studies.items():study_by_key[key(p)].append(p)
skipped_keys=[]
for p,c in refs.items():
    k=key(p)
    grade=grade_label(c)
    if not grade or normalize(grade_names[k[0]]) not in normalize(grade):
        skipped_keys.append(p);continue
    # Existing links to a subject page are stronger evidence than a filename.
    linked=[x for x in get_links(p,c) if x in studies]
    if linked and not any(key(x)==k for x in linked):
        skipped_keys.append(p);continue
    by_key[k].append(p)
counts=Counter()
visible=set()
for p,c in docs.items():
    name=tag_text(c,"h1")
    assert name, f"{p}: missing h1"
    old=tag_text(c,"title")
    desc0=get_meta(c)
    assert desc0 and old, p
    if p in refs:
        # Use the actual displayed resource name, retaining its edition/author.
        title=name+" | طه أندرويد"
        g=grade_label(c);sub=subject_label(c);src=source_label(c)
        context=f"{sub}، {g}" if sub and g else (g or sub or "")
        if g and normalize(g) in normalize(name) and sub and normalize(sub) in normalize(name):context=""
        desc=short("تصفح "+name+"، "+(context+"؛ " if context else "")+src+"، ومعلومات المرجع وروابط الشروحات للمراجعة.")
        k=key(p)
        valid=p in by_key.get(k,[])
        candidates=(study_by_key.get(k,[])+[x for x in by_key.get(k,[]) if x!=p and x.split("/")[0]!=p.split("/")[0]]) if valid else []
    else:
        # Keep the page's actual subject, grade and counts, without inventing lessons.
        stem=re.split(r"\s+[-–—]\s+طه أندرويد|\s*\|\s*طه أندرويد",old)[0].strip()
        title=(stem if stem.startswith("شرح") else "شرح "+stem)+" | طه أندرويد"
        topics=[]
        for m in re.finditer(r"<h2\b[^>]*>(.*?)</h2>",c,re.I|re.S):
            v=clean(m[1])
            if re.match(r"^(?:الفصل\s*)?\d+\s*[.:،\-]",v):
                v=re.sub(r"^(?:الفصل\s*)?\d+\s*[.:،\-]\s*","",v)
                if v and v not in topics:topics.append(v)
        desc=short(desc0.rstrip(".")+"؛ "+("من المحاور: "+"، ".join(topics[:2])+"." if topics else "اختر موضوعك للمراجعة.")) if len(desc0)<135 else desc0
        candidates=by_key.get(key(p),[])
    title=title.replace(" | طه أندرويد | طه أندرويد"," | طه أندرويد")
    new=metadata(c,title,desc)
    counts["reviewed"]+=1
    existing=get_links(p,c)
    targets=[x for x in dict.fromkeys(candidates) if x!=p and x not in existing]
    if targets and 'id="related-study-resources"' not in new:
        items=[]
        for x in targets:
            assert x in paths and key(x)==key(p)
            link=posixpath.relpath(x,posixpath.dirname(p) or ".")
            items.append(f'<li><a href="{esc(link)}">{esc(tag_text(docs[x],"h1"))}</a></li>')
        block='<section id="related-study-resources"><h2>مصادر ودروس مرتبطة بنفس الصف والمادة</h2><ul>'+"".join(items)+'</ul></section>'
        assert len(re.findall(r"</main>",new,re.I))==1, p
        new=re.sub(r"</main>",lambda _:block+"</main>",new,count=1,flags=re.I)
        visible.add(p);counts["links_added"]+=len(items);counts["pages_with_new_links"]+=1
    if new!=c:
        (ROOT/p).write_text(new,encoding="utf-8")
        counts["changed"]+=1
        counts["books" if p.startswith("books/") else "notes" if p.startswith("mlazim/") else "subjects"]+=1
# Update lastmod only for visible, real internal-navigation changes.
def update_url(m):
    block=m[0]
    loc=re.search(r"<loc>(.*?)</loc>",block,re.S)
    if not loc:return block
    p=unquote(html.unescape(loc[1])[len(BASE):])
    if p not in visible:return block
    if re.search(r"<lastmod>.*?</lastmod>",block,re.S):
        return re.sub(r"<lastmod>.*?</lastmod>","<lastmod>2026-11-27</lastmod>",block,count=1,flags=re.S)
    return block.replace("</loc>","</loc><lastmod>2026-11-27</lastmod>",1)
updated=re.sub(r"<url>.*?</url>",update_url,xml,flags=re.S)
new_root=ET.fromstring(updated)
assert [n.text for n in new_root.findall(f"{{{NS}}}url/{{{NS}}}loc")]==all_urls
if updated!=xml:sitemap.write_text(updated,encoding="utf-8")
print(json.dumps({"counts":dict(counts),"reference_matching_skips":skipped_keys,"sitemap_urls":len(all_urls)},ensure_ascii=False))
