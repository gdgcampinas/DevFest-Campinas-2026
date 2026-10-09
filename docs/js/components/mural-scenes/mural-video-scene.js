/**
 * Cena de VÍDEO: a próxima clipe pronto de uma lista (`params.playlist`, data/mural-videos.js). Os clipes são baixados ANTES por features/video-cache.js (um de cada vez, guardados no navegador): só entra
 * clipe que já está pronto, então o telão nunca engasga nem fica esperando rede no meio da cena; sem nenhum pronto a cena não aparece (MURAL_SKIP) e o rodízio segue. O tempo de tela é a duração do clipe
 * (+ uma folga), não um número fixo. Toca MUDO, ou COM SOM nos momentos e fases que o dado permite (features/video-sound.js); se o navegador bloquear o som (política de autoplay) toca mudo em vez de
 * ficar parado. Se o vídeo der erro, avisa o motor (`deps.reportError`), que pula a cena. Ao sair, solta o vídeo (libera o decodificador).
 * LEGENDAS: o vídeo toca mudo, então a fala aparece em texto por cima (data/mural-captions.js, frases com tempo; features/mural-captions.js escolhe a do segundo atual); clipe sem legenda ou que já a tem gravada não leva.
 * Cada clipe diz como se encaixa em qualquer proporção de telão (`fit`/`focus`, features como as artes). Tudo injetado: `videos` (repository), `cache`, `baseUrl` (vazio = vídeos desligados), `slackSeconds`, `captions` (data/mural-captions.js: as legendas por clipe, desenhadas sobre o vídeo mudo; o texto muda conforme o vídeo anda), `captionTickMs`, `playRetries` e `playRetryMs` (quantas vezes e de quanto em quanto tempo tenta tocar de novo quando o navegador pausa o vídeo pra economizar energia).
 */
function createVideoScene({ videos, cache, baseUrl, slackSeconds = 0.6, captions = { cuesFor: () => [] }, captionTickMs = 150, playRetries = 20, playRetryMs = 500 }) {
  const cursors = new Map(); // playlist -> posição da próxima
  return {
    prepare(params, ctx) {
      if (!baseUrl) return MURAL_SKIP;
      const playlist = videos.playlist(params.playlist);
      if (!playlist?.clips.length) return MURAL_SKIP;
      const start = cursors.get(params.playlist) ?? 0;
      for (let step = 0; step < playlist.clips.length; step++) {
        const index = (start + step) % playlist.clips.length;
        const clip = playlist.clips[index];
        const src = cache.request(`${baseUrl}${clip.file}`);
        if (src) {
          cursors.set(params.playlist, (index + 1) % playlist.clips.length);
          return { clip, src, sound: videoSoundAllowed(playlist.sound, ctx) };
        }
      }
      return MURAL_SKIP; // nenhum clipe baixado ainda
    },
    render({ clip, src, sound }) {
      const cues = captions.cuesFor(clip.id);
      return {
        markup: `<section class="ms ms-video"><video class="ms-video-el" src="${escapeHtml(src)}" playsinline preload="auto" style="${muralFitVars(clip)}"${sound ? "" : " muted"}></video>${clip.label ? `<p class="ms-video-caption">${escapeHtml(clip.label)}</p>` : ""}${cues.length ? '<p class="ms-video-sub" data-sub aria-live="off"></p>' : ""}</section>`,
        seconds: clip.seconds + slackSeconds,
        mount(el, deps) {
          const video = el.querySelector("video");
          const fail = reason => deps.reportError?.(new Error(`vídeo ${clip.id}: ${reason}`));
          video.addEventListener("error", () => fail("não carregou"));
          const play = () => Promise.resolve(video.play()); // navegador sem promessa (ou teste) também vale
          let cancelRetry = () => {};
          const start = (attempt = 0) => play().catch(async error => {
            if (error?.name === "AbortError" && deps.schedule && attempt < playRetries) { // o navegador pausou o vídeo "pra economizar energia" (janela escondida ou coberta): tenta de novo até ela voltar, em vez de derrubar a cena
              cancelRetry = deps.schedule(() => start(attempt + 1), playRetryMs);
              return;
            }
            if (!sound || error?.name !== "NotAllowedError") return fail(error?.message ?? "não tocou");
            video.muted = true; // o navegador bloqueou o som: segue mudo (o comando do quiosque libera: --autoplay-policy=no-user-gesture-required)
            await play().catch(second => fail(second?.message ?? "não tocou"));
          });
          start();
          const subEl = el.querySelector("[data-sub]");
          const stopCaptions = subEl ? scheduleEvery(deps.schedule, captionTickMs, () => {
            const text = captionAt(cues, video.currentTime);
            if (subEl.textContent !== text) subEl.textContent = text;
            subEl.hidden = !text;
          }) : () => {};
          return () => { cancelRetry(); stopCaptions(); video.pause(); video.removeAttribute("src"); video.load(); };
        },
      };
    },
  };
}
