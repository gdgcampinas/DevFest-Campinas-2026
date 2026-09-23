#!/bin/bash
# Regera TODOS os PNGs de marca a partir do SVG oficial do logo (docs/assets/brand/gdg-icon.svg)
# e dos dois designs deste diretório. Rode da raiz do repositório:
#   DevFestIA/design/build-brand-assets.sh
# Precisa de: rsvg-convert (brew install librsvg), Google Chrome e sips (macOS).
# Não precisa de PDF nem de Illustrator: o SVG do logo é a fonte no repositório
# (extraído de gdg-campinas-logo.pdf, ver PROJECT_CONTEXT "Marca e logo").
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ICONS="$ROOT/docs/assets/icons"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

rsvg-convert -w 32 "$ROOT/docs/assets/brand/gdg-icon.svg" -o "$ICONS/favicon-32.png"

"$CHROME" --headless=new --hide-scrollbars --window-size=512,512 --virtual-time-budget=4000 \
  --screenshot="$ICONS/icon-512.png" "file://$ROOT/DevFestIA/design/app-icon.html" >/dev/null 2>&1
sips -z 192 192 "$ICONS/icon-512.png" --out "$ICONS/icon-192.png" >/dev/null
sips -z 180 180 "$ICONS/icon-512.png" --out "$ICONS/apple-touch-icon.png" >/dev/null       # iOS: tela de início

"$CHROME" --headless=new --hide-scrollbars --window-size=1200,630 --virtual-time-budget=8000 \
  --screenshot="$ROOT/docs/assets/img/og-image.png" "file://$ROOT/DevFestIA/design/og-image.html" >/dev/null 2>&1
echo "Marca regerada: gdg-icon, favicon-32, icon-192/512, apple-touch-icon, og-image"
