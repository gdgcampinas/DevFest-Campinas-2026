/**
 * Liberação dos VÍDEOS da PUC-Campinas no telão (anfitriã e apoiadora do evento; vídeo institucional do canal oficial dela no YouTube, cortado em clipes por DevFestIA/tools/video/cuts-puc.json).
 * `public: false`: as cenas `video-puc-*` e `apoio-video` ficam DESLIGADAS no telão de produção (a cena `apoio` simples continua no lugar) até o OK da PUC. `true` liga todas de uma vez.
 * Pra ver antes de liberar: `telao.html?cenas=video-puc-resumo` (e as outras; `?cenas=` mostra a cena pedida mesmo desligada, ver filterScenesByIds em features/mural-playlist.js; as de almoço e encerramento ainda pedem o momento: use também ``?cenas=` mostra a cena pedida mesmo desligada, ver filterScenesByIds em features/mural-playlist.jsdemo=2026-11-28T12:30`).
 */
const PUC_VIDEO_CONFIG = {
  public: false,
};
