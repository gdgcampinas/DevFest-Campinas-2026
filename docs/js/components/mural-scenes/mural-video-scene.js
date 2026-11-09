/**
 * Cena de VÍDEO: a próxima clipe pronto de uma lista (`params.playlist`, data/mural-videos.js). Os clipes são baixados ANTES por features/video-cache.js (um de cada vez, guardados no navegador): só entra
 * clipe que já está pronto, então o telão nunca engasga nem fica esperando rede no meio da cena; sem nenhum pronto a cena não aparece (MURAL_WAIT: tenta de novo em segundos) e o rodízio segue. O tempo de tela é a duração do clipe
 * (+ uma folga), não um número fixo. Toca MUDO, ou COM SOM nos momentos e fases que o dado permite (features/video-sound.js); se o navegador bloquear o som (política de autoplay) toca mudo em vez de
 * ficar parado. Se o vídeo der erro, avisa o motor (`deps.reportError`), que pula a cena. Ao sair, solta o vídeo (libera o decodificador).
 * LEGENDAS: o vídeo toca mudo, então a fala aparece em texto por cima (data/mural-captions.js, frases com tempo; features/mural-captions.js escolhe a do segundo atual); clipe sem legenda ou que já a tem gravada não leva.
 * Cada clipe diz como se encaixa em qualquer proporção de telão (`fit`/`focus`, features como as artes). Tudo injetado: `picker` (mural-clip-picker.js; sem ele monta um com `videos` (repository), `cache` e `baseUrl` (vazio = vídeos desligados)), `slackSeconds`, `captions` (data/mural-captions.js: as legendas por clipe, desenhadas sobre o vídeo mudo; o texto muda conforme o vídeo anda), `captionTickMs`, `playRetries` e `playRetryMs` (quantas vezes e de quanto em quanto tempo tenta tocar de novo quando o navegador pausa o vídeo pra economizar energia).
 */
function createVideoScene({ videos, cache, baseUrl, picker = createClipPicker({ videos, cache, baseUrl }), slackSeconds = 0.6, captions = { cuesFor: () => [] }, captionTickMs = 150, playRetries = 20, playRetryMs = 500 }) {
  return {
    prepare(params, ctx) {
      const picked = picker.next(params.playlist);
      if (typeof picked === "symbol" || !picked) return picked;
      return { clip: picked.clip, src: picked.src, sound: videoSoundAllowed(picked.soundRule, ctx) };
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
          const cancelPlay = muralPlayVideo(video, { sound, deps, retries: playRetries, retryMs: playRetryMs, fail });
          const subEl = el.querySelector("[data-sub]");
          const stopCaptions = subEl ? scheduleEvery(deps.schedule, captionTickMs, () => {
            const text = captionAt(cues, video.currentTime);
            if (subEl.textContent !== text) subEl.textContent = text;
            subEl.hidden = !text;
          }) : () => {};
          return () => { cancelPlay(); stopCaptions(); muralReleaseVideo(video); };
        },
      };
    },
  };
}
