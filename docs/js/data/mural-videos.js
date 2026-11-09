/**
 * VÍDEOS do mural (clipes cortados dos vídeos das edições, gerados por DevFestIA/tools/video/encode-clips.sh a partir de cuts-<edição>.json). Os arquivos NÃO ficam no repositório (público, histórico pesado):
 * ficam num anexo de release do GitHub e o intermediário (DevFestIA/tools/album-proxy, rota `/media/<arquivo>`) entrega com CORS pro mural, que baixa antes e guarda no navegador (features/video-cache.js).
 *   clips      cada clipe: `id`, `file`, `label` (etiqueta na tela), `seconds` (duração real, o tempo de tela), `fit`/`focus` (como encaixa em qualquer proporção de telão, igual às artes;
 *              padrão cover; um objeto por forma de tela: { default, ultrawide, wide, standard, tall })
 *   playlists  listas que as cenas pedem por nome (`params.playlist`): `clips` (ids, em ordem; cada vez que a cena volta toca o próximo) e `sound` (OPCIONAL: momentos da grade e fases do evento em que toca COM
 *              som; sem ele, ou fora deles, toca mudo, ver features/video-sound.js; hoje desligado)
 */
/** Os clipes são 2048 x 1080 (quase 1,9:1): preenchem 16:9 e 4:3 (cortam pouco dos lados) e aparecem inteiros no telão ultra largo e no vertical. */
const VIDEO_FIT = { default: "cover", ultrawide: "contain", tall: "contain" };

const MURAL_VIDEO_CLIPS = [
  { id: "devfest-2025-abertura", file: "devfest-2025-abertura.mp4", label: "DevFest 2025: abertura", seconds: 10.6, fit: VIDEO_FIT },
  { id: "devfest-2025-chegada", file: "devfest-2025-chegada.mp4", label: "DevFest 2025: chegada", seconds: 9.7, fit: VIDEO_FIT },
  { id: "devfest-2025-palco", file: "devfest-2025-palco.mp4", label: "DevFest 2025: palco", seconds: 9.8, fit: VIDEO_FIT },
  { id: "devfest-2025-conexoes", file: "devfest-2025-conexoes.mp4", label: "DevFest 2025: conexões", seconds: 14.8, fit: VIDEO_FIT },
  { id: "devfest-2025-conversas", file: "devfest-2025-conversas.mp4", label: "DevFest 2025: conversas", seconds: 15.2, fit: VIDEO_FIT },
  { id: "devfest-2025-salas", file: "devfest-2025-salas.mp4", label: "DevFest 2025: salas", seconds: 15.0, fit: VIDEO_FIT },
  { id: "devfest-2025-equipe", file: "devfest-2025-equipe.mp4", label: "DevFest 2025: equipe", seconds: 16.0, fit: VIDEO_FIT },
  { id: "devfest-2025-aprendizado", file: "devfest-2025-aprendizado.mp4", label: "DevFest 2025: aprendizado", seconds: 13.8, fit: VIDEO_FIT },
  { id: "devfest-2025-final", file: "devfest-2025-final.mp4", label: "DevFest 2025: final", seconds: 13.4, fit: VIDEO_FIT },
  // Institucional da patrocinadora FIAP (1920 x 1080, 15 s, sem áudio): playlist própria, só entra na cena `video-fiap` (atrás da revelação).
  { id: "fiap-institucional", file: "fiap-institucional.mp4", label: "FIAP", seconds: 15.0, fit: VIDEO_FIT },
  // Institucional da patrocinadora BOSCH (1920 x 1080, 30 s, SEM áudio: reencodado do original, que tinha som; o telão toca mudo). Playlist própria, cena `video-bosch`. Anexo na release `mural-video-2025` (2026-11-06).
  { id: "bosch-institucional", file: "bosch-institucional.mp4", label: "Bosch", seconds: 30.0, fit: VIDEO_FIT },
  // Institucional da PUC-Campinas (1920 x 1080, sem áudio, cortes de cuts-puc.json), todos na release `mural-video-2025` (2026-11-09). Cada corte é uma lista própria porque cada cena toca o seu (data/mural-scenes.js).
  { id: "puc-resumo", file: "puc-resumo.mp4", label: "PUC-Campinas", seconds: 30.03, fit: VIDEO_FIT },
  { id: "puc-campus", file: "puc-campus.mp4", label: "PUC-Campinas: o campus e a vida de estudante", seconds: 20.03, fit: VIDEO_FIT },
  { id: "puc-fechamento", file: "puc-fechamento.mp4", label: "PUC-Campinas", seconds: 20.03, fit: VIDEO_FIT },
  { id: "puc-completo", file: "puc-completo.mp4", label: "PUC-Campinas", seconds: 229.57, fit: VIDEO_FIT }, // 1280 x 720, o vídeo inteiro (almoço e encerramento)
  { id: "puc-fundo", file: "puc-fundo.mp4", label: "", seconds: 12, fit: "cover" }, // fundo animado em laço (mural-backdrop.js), sem etiqueta
];

const MURAL_VIDEO_PLAYLISTS = {
  "devfest-2025": {
    clips: MURAL_VIDEO_CLIPS.filter(clip => clip.id.startsWith("devfest-2025-")).map(clip => clip.id),
    // sem `sound`: o telão toca os vídeos SEMPRE MUDOS (decisão do Renato em 2026-10-08, o som não ficou bom). Pra voltar o som é só pôr aqui, ex.: sound: { moments: ["lunch"], phases: ["after"] }
  },
  fiap: { clips: ["fiap-institucional"] },
  bosch: { clips: ["bosch-institucional"] },
  "puc-resumo": { clips: ["puc-resumo"] },
  "puc-campus": { clips: ["puc-campus"] },
  "puc-fechamento": { clips: ["puc-fechamento"] },
  "puc-completo": { clips: ["puc-completo"] },
  "puc-fundo": { clips: ["puc-fundo"] },
};

const muralVideosRepository = createRepository({ clips: MURAL_VIDEO_CLIPS, playlists: MURAL_VIDEO_PLAYLISTS }, {
  playlist: name => {
    const playlist = MURAL_VIDEO_PLAYLISTS[name];
    if (!playlist) return null;
    return { sound: playlist.sound, clips: playlist.clips.map(id => MURAL_VIDEO_CLIPS.find(clip => clip.id === id)).filter(Boolean) };
  },
  /** Os arquivos de todos os clipes (o mural baixa antes de precisar). */
  files: () => MURAL_VIDEO_CLIPS.map(clip => clip.file),
  /** Só os arquivos das listas pedidas (o mural baixa só o que as cenas LIGADAS vão tocar: os vídeos ainda não liberados não gastam a rede do telão). */
  filesFor: names => [...new Set(names.flatMap(name => (MURAL_VIDEO_PLAYLISTS[name]?.clips ?? []).map(id => MURAL_VIDEO_CLIPS.find(clip => clip.id === id)?.file)))].filter(Boolean),
});
