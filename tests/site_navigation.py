"""Check that site entry, curriculum hierarchy and onward navigation remain discoverable."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
import sys

root=Path(__file__).resolve().parents[1]
grade_files=[
"grade-one.html","grade-two.html","grade-three.html","grade-four.html",
"grade-five.html","grade-six.html","grade-first-middle.html",
"grade-second-middle.html","grade-third-middle.html",
"grade-fourth-scientific.html","grade-fifth-scientific.html","grade-sixth-scientific.html",
"grade-fourth-literary.html","grade-fifth-literary.html","grade-sixth-literary.html"
]
video_files=[
"video-grade-one-primary.html","video-grade-two-primary.html","video-grade-three-primary.html",
"video-grade-four-primary.html","video-grade-five-primary.html","video-grade-six-primary.html",
"video-grade-one-middle.html","video-grade-two-middle.html","video-grade-three-middle.html",
"video-grade-four-scientific.html","video-grade-five-scientific.html","video-grade-six-scientific.html",
"video-grade-four-literary.html","video-grade-five-literary.html","video-grade-six-literary.html"
]
class Index(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=set()
        self.h1s=0
        self.links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get("id"):self.ids.add(a["id"])
        if tag=="h1":self.h1s+=1
        if tag=="a" and a.get("href"):self.links.append(a["href"])
errors=[]
idx=Index()
idx.feed((root/"index.html").read_text(encoding="utf-8"))
if idx.h1s!=1:errors.append(f"Home should have one primary heading, found {idx.h1s}")
for anchor in ("home","school","apps","bots","videos","articles"):
    if anchor not in idx.ids:errors.append(f"Missing homepage section #{anchor}")
for url in ("library.html","lessons.html","video-all-grades.html","curriculum-index.html"):
    if url not in idx.links:errors.append(f"Missing homepage path to {url}")
for file in grade_files:
    if file not in idx.links:errors.append(f"Grade not linked from home: {file}")
for path in grade_files+video_files+[
    "library.html","lessons.html","curriculum-index.html","video-all-grades.html",
    "video-library.html","download-plus-pro.html","teachers.html","youtube.html"
]:
    content=(root/path).read_text(encoding="utf-8")
    if 'src="site-paths.js?v=1"' not in content:
        errors.append(f"Missing cross-section navigation: {path}")
for source in ("portal-home.css","site-paths.js"):
    if not (root/source).is_file():errors.append(f"Missing asset {source}")
sitemap=(root/"sitemap.xml").read_text(encoding="utf-8")
for path in grade_files:
    if ("/"+path+"</loc>") not in sitemap:errors.append(f"Grade missing from sitemap: {path}")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("PASS: homepage hierarchy, 15 grade paths, 15 video guides, linked sections and sitemap")
