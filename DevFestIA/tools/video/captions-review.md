# Legendas dos clipes do telão: revisão (2026-10-09)

Transcrição inicial pelo Whisper (`whisper-cli`, modelo `ggml-small.bin`, português) a partir do áudio dos 9 clipes de `~/Downloads/devfest-mural-clips-2025/`, depois revisada à mão. As frases finais moram em `docs/js/data/mural-captions.js` (corrigir uma frase é editar lá). O telão toca os vídeos MUDOS e desenha a legenda por cima.

## Como refazer a transcrição (outro ano ou outros cortes)
```bash
brew install whisper-cpp
mkdir -p ~/.cache/whisper-cpp-models && curl -L -o ~/.cache/whisper-cpp-models/ggml-small.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
ffmpeg -i clipe.mp4 -ar 16000 -ac 1 -c:a pcm_s16le clipe.wav && whisper-cli -m ~/.cache/whisper-cpp-models/ggml-small.bin -f clipe.wav -l pt -osrt -of clipe
```

## O que o Whisper errou e como ficou (confirmar com quem fala ou com a gravação)
| Clipe | O Whisper ouviu | Na legenda | Dúvida |
|---|---|---|---|
| abertura | "na Fataque Campinas" | "aqui hoje em Campinas" | O microfone no vídeo parece dizer **Fatec**: se for o local, pode virar "na Fatec Campinas". |
| palco | "Campina", "geospaciais" | "DevFest Campinas", "geoespaciais" | ok |
| conexões | "Diminide", "G da Gente Campina" | "Gemini", "DevFest Campinas" | confirmar que é Gemini e "DevFest Campinas" |
| conversas | "arquiteto de startup", "gestão e híbrida", "E aquilo, DevFest..." | "arquitetura de startup", "gestão híbrida", "Aqui no DevFest Campinas 2025" | última frase incerta |
| salas | "segurança na frente gente" | "segurança no front-end" | confirmar |
| equipe | "traz o geminai pra cá" | "trazer o Gemini pra cá" | o clipe começa e termina no meio da fala |
| aprendizado | "dados pode ajudar todos nosso área" | "dados podem ajudar a nossa área profissional e pessoal" | ok |
| final | começa no meio da frase | mantida como veio | ok |
| chegada | só música | sem legenda | **já tem legenda gravada no vídeo**, a nossa não entra |
