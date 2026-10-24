#!/bin/bash
# Renders board.html at three fidelities to PDF with headless Chrome, then checks pages and links.
# Usage: tools/build-pdfs.sh   (run from the project root)
set -e
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
PORT=4189
python3 -m http.server $PORT >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
mkdir -p deliverables
for pair in "lofi:01-Lofi-Mobile-Wireframe" "wire:02-Interactive-Mobile-Wireframe" "proto:03-Mobile-Prototype" "midfi:04-Midfi-Mobile-Wireframe" "proto&layout=sheet:03-Hifi-Mobile-Prototype"; do
  fi="${pair%%:*}"; name="${pair##*:}"
  out="deliverables/$name.pdf"; rm -f "$out"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=9000 \
    --user-data-dir="$(mktemp -d)" --print-to-pdf="$out" \
    "http://localhost:$PORT/board.html?fi=$fi" >/dev/null 2>&1 & CPID=$!
  # Headless Chrome can linger after writing the file, so wait for a stable file and stop it.
  for i in $(seq 1 90); do
    sleep 1
    if [ -s "$out" ]; then a=$(stat -f%z "$out"); sleep 2; b=$(stat -f%z "$out"); [ "$a" = "$b" ] && break; fi
    kill -0 $CPID 2>/dev/null || break
  done
  kill $CPID 2>/dev/null || true; wait $CPID 2>/dev/null || true
  [ -s "$out" ] || { echo "FAILED $out"; exit 1; }
  echo "built deliverables/$name.pdf"
done
python3 tools/check-pdfs.py
