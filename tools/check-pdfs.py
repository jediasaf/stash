"""Checks the exported boards: page count, internal links resolve, no link points off-document.
The lo-fi wireframe is a single continuous sheet; the other two are one board per page plus cover and audit."""
import os, sys, pymupdf
ok = True
for name, want_pages, want_links in [("01-Lofi-Mobile-Wireframe", 1, False), ("02-Interactive-Mobile-Wireframe", 15, True), ("03-Mobile-Prototype", 15, True), ("04-Midfi-Mobile-Wireframe", 1, True), ("03-Hifi-Mobile-Prototype", 1, True)]:
    path = f"deliverables/{name}.pdf"
    d = pymupdf.open(path)
    if d.page_count > want_pages and not d[-1].get_text().strip():  # Chrome can append an empty sheet
        d.delete_page(d.page_count - 1); d.save(path + ".tmp", garbage=3, deflate=True); d.close(); os.replace(path + ".tmp", path); d = pymupdf.open(path)
    links = [l for p in d for l in p.get_links()]
    internal = [l for l in links if l["kind"] in (pymupdf.LINK_GOTO, pymupdf.LINK_NAMED)]
    bad = [l for l in internal if l.get("page", 0) < 0 or l.get("page", 0) >= d.page_count]
    external = [l.get("uri") for l in links if l["kind"] == pymupdf.LINK_URI]
    r = d[0].rect
    print(f"{name}: {d.page_count} pages, {round(r.width)}x{round(r.height)} pt, {len(internal)} internal links, {len(bad)} broken, {len(external)} external")
    if not d[0].get_text().strip(): print('  first page has no text'); ok = False
    if d.page_count != want_pages or bad or external or (want_links and len(internal) < 100): ok = False
sys.exit(0 if ok else 1)
