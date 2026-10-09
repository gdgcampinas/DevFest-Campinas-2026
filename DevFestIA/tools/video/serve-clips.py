#!/usr/bin/env python3
"""
Serve os clipes do telão da sua máquina (pasta ~/Downloads/devfest-mural-clips-2025 ou a que você passar) em http://127.0.0.1:8099/ COM CORS, só pra TESTAR o mural com vídeo e legenda antes de publicar a release:
  python3 DevFestIA/tools/video/serve-clips.py
  e abra  https://gdgcampinas.github.io/DevFest-Campinas-2026/mural.html?lineup=1&ensaio=0&cenas=video-2025&videos=http://127.0.0.1:8099/
Escuta só no seu computador (127.0.0.1). Ctrl+C pra parar.
"""
import http.server
import os
import sys

folder = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/Downloads/devfest-mural-clips-2025")
os.chdir(folder)


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, *args):
        pass


print(f"Servindo {folder} em http://127.0.0.1:8099/ (Ctrl+C pra parar)")
http.server.ThreadingHTTPServer(("127.0.0.1", 8099), Handler).serve_forever()
