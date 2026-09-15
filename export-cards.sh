#!/usr/bin/env bash
# Export card-front.html and card-back.html to PDF + 300 DPI PNG
# Uses your Mac's installed Chrome (or Chromium / Brave / Edge — see below).
#
# Usage:
#   ./export-cards.sh           # writes card-{front,back}.{pdf,png} alongside this script
#
# Requires: Google Chrome installed in /Applications. If you use a different
# Chromium-based browser, set CHROME=/path/to/binary before running, e.g.
#   CHROME="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" ./export-cards.sh

set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
HERE="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -x "$CHROME" ]]; then
  echo "Chrome not found at: $CHROME"
  echo "Set CHROME=/path/to/your/chromium-binary and re-run."
  exit 1
fi

# 3.5" x 2" at 300 DPI = 1050 x 600 pixels.
# Chrome's --window-size is in CSS pixels (96 per inch), so we tell Chrome
# the page is 336x192 CSS px and apply a 3.125x device scale factor to land
# on 1050x600 actual pixels in the screenshot.

for face in front back; do
  echo "→ Rendering $face"

  # PDF — actual print trim, no headers/footers/margins.
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --no-pdf-header-footer \
    --no-margins \
    --print-to-pdf="$HERE/card-$face.pdf" \
    --print-to-pdf-no-header \
    "file://$HERE/card-$face.html" 2>/dev/null

  # PNG — 300 DPI flat image at trim size.
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --window-size=336,192 \
    --force-device-scale-factor=3.125 \
    --screenshot="$HERE/card-$face.png" \
    "file://$HERE/card-$face.html" 2>/dev/null

  echo "  → card-$face.pdf"
  echo "  → card-$face.png"
done

echo ""
echo "Done. Files:"
ls -lh "$HERE"/card-front.pdf "$HERE"/card-front.png "$HERE"/card-back.pdf "$HERE"/card-back.png 2>/dev/null
