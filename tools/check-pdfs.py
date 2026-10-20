"""Checks the exported boards: page count, page size, internal links resolve, no link points off-document."""
import sys, pymupdf
ok = True
for name, want_links in [("01-Lofi-Mobile-Wireframe", False), ("02-Interactive-Mobile-Wireframe", True), ("03-Mobile-Prototype", True)]:
    path = f"deliverables/{name}.pdf"
    d = pymupdf.open(path)
    if d.page_count == 15 and not d[14].get_text().strip():  # Chrome appends an empty sheet
        d.delete_page(14); d.saveIncr() if False else d.save(path + ".tmp", garbage=3, deflate=True); d.close()
        import os; os.replace(path + ".tmp", path); d = pymupdf.open(path)
    links = [l for p in d for l in p.get_links()]
    internal = [l for l in links if l["kind"] in (pymupdf.LINK_GOTO, pymupdf.LINK_NAMED)]
    bad = [l for l in internal if l.get("page", 0) < 0 or l.get("page", 0) >= d.page_count]
    external = [l.get("uri") for l in links if l["kind"] == pymupdf.LINK_URI]
    r = d[0].rect
    print(f"{name}: {d.page_count} pages, {round(r.width)}x{round(r.height)} pt, {len(internal)} internal links, {len(bad)} broken, {len(external)} external")
    if d.page_count != 14 or bad or external or (want_links and len(internal) < 100): ok = False
sys.exit(0 if ok else 1)
