"""Fast offline checks for site navigation, teaching links and XML sitemap."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from xml.etree import ElementTree as ET
import sys

ROOT = Path(__file__).resolve().parents[1]
SITE_PATH = "/Taha-Android-V2/"
ISSUES = []

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.attrs_found = []
        self.robots = ""
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name", "").lower() == "robots":
            self.robots = attrs.get("content", "")
        for attr in ("href", "src"):
            if attrs.get(attr):
                self.attrs_found.append((tag, attr, attrs[attr]))

def local_target(value):
    value = value.strip()
    if not value or value.startswith(("#", "//")):
        return None
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = unquote(parsed.path)
    if path.startswith(SITE_PATH):
        path = path[len(SITE_PATH):]
    elif path.startswith("/"):
        return None  # Root paths may be services outside the static site.
    return (ROOT / path).resolve()

INDEXED = set()
PAGES = sorted(ROOT.rglob("*.html"))
for path in PAGES:
    # Only public site pages (not generated cache/third-party templates).
    if ".git" in path.parts:
        continue
    parser = PageParser()
    try:
        parser.feed(path.read_text(encoding="utf-8"))
    except UnicodeDecodeError:
        ISSUES.append(f"{path.relative_to(ROOT)}: invalid UTF-8")
        continue
    if "noindex" not in parser.robots.lower():
        INDEXED.add(path.relative_to(ROOT).as_posix())
    for tag, attr, value in parser.attrs_found:
        target = local_target(value)
        if target is not None and (not target.is_relative_to(ROOT) or not target.is_file()):
            ISSUES.append(f"{path.relative_to(ROOT)}: missing {attr}={value}")
sitemap = ET.parse(ROOT / "sitemap.xml")
urls = []
for node in sitemap.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc"):
    link = (node.text or "").strip()
    parsed = urlsplit(link)
    if parsed.scheme != "https" or parsed.netloc != "taha20054ta10-prog.github.io" or not parsed.path.startswith(SITE_PATH):
        ISSUES.append(f"Invalid sitemap URL: {link}")
        continue
    name = unquote(parsed.path[len(SITE_PATH):]) or "index.html"
    urls.append(name)
    if not (ROOT / name).is_file():
        ISSUES.append(f"Sitemap points to absent file: {name}")
    if name.endswith(".html") and name not in INDEXED:
        ISSUES.append(f"Sitemap includes a noindex page: {name}")
if len(urls) != len(set(urls)):
    ISSUES.append("Duplicate sitemap entries")
for required in ["ads.html", "library.html", "video-all-grades.html"]:
    if required not in urls:
        ISSUES.append(f"Public page missing from sitemap: {required}")
if ISSUES:
    for problem in ISSUES[:100]:
        print(problem)
    print(f"FAIL: {len(ISSUES)} issue(s) across {len(PAGES)} HTML pages")
    sys.exit(1)
print(f"PASS: {len(PAGES)} HTML pages; {len(urls)} sitemap entries; local links and assets valid")
