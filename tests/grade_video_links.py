"""Validate internal learning paths and external attribution in all 15 video guides."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import sys

ROOT = Path(__file__).resolve().parents[1]
GRADES = ("one-primary two-primary three-primary four-primary five-primary six-primary "
          "one-middle two-middle three-middle four-scientific five-scientific "
          "six-scientific four-literary five-literary six-literary").split()

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.hrefs = []
        self.paths = 0
        self.video_sources = 0
    def handle_starttag(self, tag, pairs):
        props = dict(pairs)
        if tag == "nav" and "study-path" in props.get("class", "").split():
            self.paths += 1
        if tag == "a" and props.get("href"):
            href = props["href"]
            self.hrefs.append(href)
            if href.startswith("https://vid.haltaelam.com/"):
                self.video_sources += 1

errors = []
directory = (ROOT / "video-all-grades.html").read_text(encoding="utf-8")
for grade in GRADES:
    page = f"video-grade-{grade}.html"
    path = ROOT / page
    if not path.is_file():
        errors.append(f"Missing grade guide: {page}")
        continue
    if f'href="{page}"' not in directory:
        errors.append(f"Directory does not link to {page}")
    parser = LinkParser()
    parser.feed(path.read_text(encoding="utf-8"))
    if parser.paths < 5:
        errors.append(f"{page}: insufficient subject links ({parser.paths})")
    if parser.video_sources < 4:
        errors.append(f"{page}: external video catalog sources are missing")
    for href in parser.hrefs:
        if href == "./" or href.startswith(("#", "//", "mailto:")):
            continue
        url = urlparse(href)
        if url.scheme:
            continue
        local = (ROOT / unquote(url.path)).resolve()
        if not local.is_relative_to(ROOT) or not local.is_file():
            errors.append(f"{page}: missing internal link {href}")
library = (ROOT / "library.html").read_text(encoding="utf-8")
if 'id="subject"' not in library or "updateSubjects(" not in library:
    errors.append("library.html: subject filter not found")
if errors:
    print("\n".join(errors))
    sys.exit(1)
print("PASS: 15 video guides, in-site subject pages and library filter")
