#!/bin/bash
# Exports the lo-fi (default) or mid-fi boards as an editable draw.io file. Run from the project root.
# Usage: tools/build-drawio.sh [lofi|midfi|hifi]
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
FI="${1:-lofi}"; PORT=4188; TMP="$(mktemp -d)"
case "$FI" in midfi) OUT=deliverables/04-Midfi-Mobile-Wireframe.drawio; Q="fi=midfi";; hifi) OUT=deliverables/03-Hifi-Mobile-Prototype.drawio; Q="fi=proto&layout=sheet";; *) OUT=deliverables/01-Lofi-Mobile-Wireframe.drawio; Q="fi=lofi";; esac
python3 -m http.server $PORT >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
"$CHROME" --headless=new --disable-gpu --window-size=1700,1200 --virtual-time-budget=9000 --user-data-dir="$TMP/p" \
  --dump-dom "http://localhost:$PORT/board.html?$Q&export=drawio" > "$TMP/dom.html" 2>/dev/null & CPID=$!
for i in $(seq 1 60); do sleep 1; grep -q '</html>' "$TMP/dom.html" 2>/dev/null && break; kill -0 $CPID 2>/dev/null || break; done
kill $CPID 2>/dev/null || true; wait $CPID 2>/dev/null || true
python3 - "$TMP/dom.html" "$OUT" <<'PY'
import sys, re, html, xml.etree.ElementTree as ET
dom = open(sys.argv[1], encoding="utf-8").read()
m = re.search(r'<pre id="drawio">(.*?)</pre>', dom, re.S)
if not m: sys.exit("export failed: no draw.io payload in page")
xml = html.unescape(m.group(1))
root = ET.fromstring(xml)  # must be well-formed
out = sys.argv[2]
open(out, "w", encoding="utf-8").write(xml)
ds = root.findall("diagram")
ids = set(); dup = 0; orphans = 0; edges = 0
for d in ds:
    cells = d.findall(".//mxCell"); local = {c.get("id") or "" for c in cells} | {u.get("id") for u in d.findall(".//UserObject")}
    for c in cells:
        if c.get("edge"): edges += 1; orphans += (c.get("source") not in local) + (c.get("target") not in local)
        if c.get("parent") and c.get("parent") not in local: orphans += 1
    for i in local:
        if i in ids and i not in ("0", "1", ""): dup += 1
        ids.add(i)
print(f"{out}: {len(ds)} pages, {len(root.findall('.//mxCell'))} cells, {edges} connectors, {dup} duplicate ids, {orphans} dangling references, {len(xml)//1024} KB")
print("per page:", [len(d.findall('.//mxCell')) for d in ds])
PY
