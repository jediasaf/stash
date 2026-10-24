#!/bin/bash
# Builds one self-contained HTML file of the clickable mobile prototype (opens by double-click, no server).
set -e
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
npx --yes esbuild@0.24.0 src/app.js --bundle --format=iife --minify --log-level=error --outfile="$TMP/app.js"
python3 - "$TMP/app.js" deliverables/Stash-Mobile-Prototype.html <<'PY'
import sys
js_path, out = sys.argv[1], sys.argv[2]
html = open("index.html").read()
for href in ["styles/tokens.css", "styles/app.css", "styles/shell.css"]:
    html = html.replace(f'<link rel="stylesheet" href="{href}">', "<style>\n" + open(href).read() + "\n</style>")
html = html.replace("The three PDFs in the deliverables folder show", "The PDF boards show")
import base64, re
hero = "data:image/webp;base64," + base64.b64encode(open("assets/stash-hero-780.webp", "rb").read()).decode()
html = re.sub(r'<link rel="preload" as="image"[^>]*>\n?', "", html)
js = open(js_path).read().replace("</script", "<\\/script")
js = js.replace('srcset="assets/stash-hero-780.webp 780w, assets/stash-hero-1200.webp 1200w" ', "").replace("assets/stash-hero-780.webp", hero)
html = html.replace('<script type="module" src="src/app.js"></script>', "<script>\n" + js + "\n</script>")
assert "src/app.js" not in html and 'href="styles/' not in html
open(out, "w").write(html)
print(out, len(html) // 1024, "KB")
PY
