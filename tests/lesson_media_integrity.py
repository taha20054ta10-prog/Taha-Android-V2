"""Audit original interactive lesson previews and attributed teacher video embeds."""
import re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
pages = {
    "grade-one-english.html":40, "grade-one-ethics.html":12,
    "grade-one-islamic.html":19, "grade-one-math.html":65,
    "grade-one-reading.html":36, "grade-one-science.html":24,
    "grade-two-english.html":64, "grade-two-ethics.html":10,
    "grade-two-islamic.html":15, "grade-two-math.html":58,
    "grade-two-reading.html":27, "grade-two-science.html":22,
    "grade-three-math.html":57,
}
total = 0
for name, minimum in pages.items():
    text = (ROOT / name).read_text(encoding="utf-8")
    assert 'src="study-slides.js?v=' in text, f"missing interactive lesson player: {name}"
    cards = len(re.findall(r'class="(?:lesson|less|topic|letter|exercise)"', text))
    assert cards >= minimum, f"Missing lesson card in {name}: {cards}/{minimum}"
    total += cards

for name, expected_ids in {
    "grade-two-math.html": ("d4Og0NbvPAk", "KOQcZGXBLIo"),
    "grade-three-math.html": ("P4-5FsMkFVA",),
}.items():
    text = (ROOT / name).read_text(encoding="utf-8")
    for vid in expected_ids:
        assert f'data-video="{vid}"' in text, f"missing matched video: {vid}"
        assert f"https://www.youtube.com/watch?v={vid}" in text, f"missing attribution: {vid}"

science = (ROOT / "grade-two-science.html").read_text(encoding="utf-8")
for video_id in ("uO5SwIIu9tk", "EeuUxMyed8E"):
    assert f"youtube-nocookie.com/embed/{video_id}" in science
    assert f"youtube.com/watch?v={video_id}" in science
script = (ROOT / "study-slides.js").read_text(encoding="utf-8")
assert "ليس فيديو مصوّراً" in script
assert "speechSynthesis" in script
print(f"PASS: {total} primary lesson cards with interactive walkthrough; 3 attributed videos")
