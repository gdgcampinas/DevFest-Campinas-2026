#!/bin/bash
# Corta o vídeo de uma edição em clipes leves pro mural do telão (2048 de largura, H.264, áudio AAC com volume nivelado, entrada e saída suaves) e escreve `clips.json` com a duração real de cada um.
# Uso: bash DevFestIA/tools/video/encode-clips.sh "<vídeo original>" <pasta de saída> [cuts.json]
# Os cortes (início, fim, nome) ficam em cuts-<edição>.json (dado, não código). Precisa do ffmpeg (brew install ffmpeg). NÃO escreve nada dentro do repositório: a pasta de saída é de quem roda.
set -euo pipefail
INPUT="$1"
OUT="$2"
CUTS="${3:-$(dirname "$0")/cuts-2025.json}"
mkdir -p "$OUT"
PREFIX=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['prefix'])" "$CUTS")
python3 - "$CUTS" <<'PY' | while IFS=$'\t' read -r id start end; do
import json, sys
for cut in json.load(open(sys.argv[1]))["cuts"]:
    print(f"{cut['id']}\t{cut['start']}\t{cut['end']}")
PY
  duration=$(python3 -c "print(round($end - $start, 3))")
  fade_out=$(python3 -c "print(round($duration - 0.4, 3))")
  file="$OUT/$PREFIX-$id.mp4"
  echo "== $id ($start a $end, ${duration}s)"
  ffmpeg -nostdin -y -v error -ss "$start" -i "$INPUT" -t "$duration" \
    -vf "scale=2048:-2:flags=lanczos,fade=t=in:st=0:d=0.4,fade=t=out:st=$fade_out:d=0.4" \
    -af "loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.4,afade=t=out:st=$fade_out:d=0.4" \
    -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -profile:v high -r 30 \
    -c:a aac -b:a 128k -ar 48000 -movflags +faststart "$file"
done
python3 - "$OUT" "$PREFIX" "$CUTS" <<'PY'
import json, subprocess, sys, os
out, prefix, cuts = sys.argv[1], sys.argv[2], sys.argv[3]
clips = []
for cut in json.load(open(cuts))["cuts"]:
    file = f"{prefix}-{cut['id']}.mp4"
    path = os.path.join(out, file)
    seconds = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())
    clips.append({"id": f"{prefix}-{cut['id']}", "file": file, "label": cut["label"], "seconds": round(seconds, 2), "megabytes": round(os.path.getsize(path) / 1e6, 1)})
json.dump(clips, open(os.path.join(out, "clips.json"), "w"), ensure_ascii=False, indent=2)
print(json.dumps(clips, ensure_ascii=False, indent=1))
PY
