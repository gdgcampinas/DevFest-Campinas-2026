#!/usr/bin/env python3
"""
Corta um vídeo em clipes leves pro mural do telão e escreve `clips.json` com a duração real de cada um. Tudo que muda de um vídeo pro outro é DADO (o arquivo de cortes), não código:

  {
    "prefix": "puc",                      prefixo do nome do arquivo e do id do clipe
    "defaults": { "width": 1920, "crf": 25, "audio": false, "fps": 30, "fade": 0.4 },   (opcional; o padrão é o de 2025: 2048, 23, com áudio, 30, 0.4)
    "cuts": [
      { "id": "abertura", "start": 0.0, "end": 10.6, "label": "..." },                  um trecho
      { "id": "resumo", "segments": [[10, 14], [20, 24]], "label": "..." }             vários trechos emendados (montagem)
    ]                                     cada corte aceita também `width`, `crf`, `audio`, `fade` pra mudar só ele
  }

Uso: python3 DevFestIA/tools/video/encode_clips.py "<vídeo original>" <pasta de saída> [cuts.json]
Precisa do ffmpeg e do ffprobe (brew install ffmpeg). NÃO escreve nada dentro do repositório: a pasta de saída é de quem roda.
"""
import json
import os
import subprocess
import sys

DEFAULTS = {"width": 2048, "crf": 23, "audio": True, "fps": 30, "fade": 0.4}


def segments_of(cut):
    return cut.get("segments") or [[cut["start"], cut["end"]]]


def filter_graph(segments, options):
    """Monta o filter_complex: recorta cada trecho, emenda, ajusta a largura e põe entrada/saída suaves (vídeo e, se houver, áudio)."""
    duration = round(sum(end - start for start, end in segments), 3)
    fade_out = round(duration - options["fade"], 3)
    count = len(segments)
    parts = []
    for index, (start, end) in enumerate(segments):
        parts.append(f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS[v{index}]")
        if options["audio"]:
            parts.append(f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{index}]")
    inputs = "".join(f"[v{i}]" + (f"[a{i}]" if options["audio"] else "") for i in range(count))
    outputs = "[vc]" + ("[ac]" if options["audio"] else "")
    parts.append(f"{inputs}concat=n={count}:v=1:a={1 if options['audio'] else 0}{outputs}")
    parts.append(f"[vc]scale={options['width']}:-2:flags=lanczos,fade=t=in:st=0:d={options['fade']},fade=t=out:st={fade_out}:d={options['fade']}[v]")
    if options["audio"]:
        parts.append(f"[ac]loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=in:st=0:d={options['fade']},afade=t=out:st={fade_out}:d={options['fade']}[a]")
    return ";".join(parts), duration


def encode_command(source, output, cut, options):
    graph, _ = filter_graph(segments_of(cut), options)
    command = ["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", source, "-filter_complex", graph, "-map", "[v]"]
    if options["audio"]:
        command += ["-map", "[a]", "-c:a", "aac", "-b:a", "128k", "-ar", "48000"]
    else:
        command += ["-an"]
    command += ["-c:v", "libx264", "-preset", "slow", "-crf", str(options["crf"]), "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", str(options["fps"]), "-movflags", "+faststart", output]
    return command


def probe_seconds(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).decode().strip())


def main(source, out_dir, cuts_path):
    spec = json.load(open(cuts_path))
    prefix = spec["prefix"]
    base = {**DEFAULTS, **spec.get("defaults", {})}
    os.makedirs(out_dir, exist_ok=True)
    clips = []
    for cut in spec["cuts"]:
        options = {**base, **{key: cut[key] for key in DEFAULTS if key in cut}}
        file = f"{prefix}-{cut['id']}.mp4"
        path = os.path.join(out_dir, file)
        print(f"== {cut['id']} ({len(segments_of(cut))} trecho(s))")
        subprocess.check_call(encode_command(source, path, cut, options))
        clips.append({"id": f"{prefix}-{cut['id']}", "file": file, "label": cut["label"], "seconds": round(probe_seconds(path), 2), "megabytes": round(os.path.getsize(path) / 1e6, 1)})
    json.dump(clips, open(os.path.join(out_dir, "clips.json"), "w"), ensure_ascii=False, indent=2)
    print(json.dumps(clips, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(__file__), "cuts-2025.json"))
