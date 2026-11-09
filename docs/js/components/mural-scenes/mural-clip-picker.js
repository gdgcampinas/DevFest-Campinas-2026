/**
 * Escolhe o PRÓXIMO clipe pronto de uma lista (`playlist`, data/mural-videos.js), de um jeito só pra toda cena que toca vídeo (a cena "vídeo" e o fundo animado de qualquer outra cena, ver mural-backdrop.js).
 * Guarda a posição de cada lista (cada vez que ela é pedida toca o seguinte e dá a volta) e só devolve clipe que o cache já baixou (features/video-cache.js): o telão nunca espera rede no meio da cena.
 * Devolve `{ clip, src, soundRule }`, ou MURAL_SKIP (sem endereço do intermediário, lista que não existe ou vazia) ou MURAL_WAIT (os clipes existem mas ainda estão baixando: tenta de novo em segundos).
 * Tudo injetado: `videos` (repository com `playlist(nome)`), `cache` (`request(url)` -> blob ou null), `baseUrl` (vazio = vídeos desligados).
 */
function createClipPicker({ videos, cache, baseUrl }) {
  const cursors = new Map(); // lista -> posição do próximo
  return {
    next(playlistName) {
      if (!baseUrl) return MURAL_SKIP;
      const playlist = videos.playlist(playlistName);
      if (!playlist?.clips.length) return MURAL_SKIP;
      const start = cursors.get(playlistName) ?? 0;
      for (let step = 0; step < playlist.clips.length; step++) {
        const index = (start + step) % playlist.clips.length;
        const clip = playlist.clips[index];
        const src = cache.request(`${baseUrl}${clip.file}`);
        if (src) {
          cursors.set(playlistName, (index + 1) % playlist.clips.length);
          return { clip, src, soundRule: playlist.sound };
        }
      }
      return MURAL_WAIT;
    },
  };
}
