#!/bin/bash
# Atalho do codificador de clipes do mural (a lógica e a documentação do formato dos cortes estão em encode_clips.py).
# Uso: bash DevFestIA/tools/video/encode-clips.sh "<vídeo original>" <pasta de saída> [cuts.json]
set -euo pipefail
exec python3 "$(dirname "$0")/encode_clips.py" "$@"
