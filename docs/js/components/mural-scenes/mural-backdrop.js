/**
 * FUNDO ANIMADO pra qualquer cena: `withBackdrop(scene, deps)` devolve a mesma cena, só que, quando o dado pede (`params.backdrop = { playlist }`), um clipe da lista toca MUDO, em laço e escurecido atrás do conteúdo.
 * Nenhuma cena precisa saber de vídeo: o desenhador original continua igual (prepare/render/mount), este só embrulha. Se o clipe não está pronto (ainda baixando, sem intermediário), a cena aparece normal, sem fundo,
 * em vez de esperar. O clipe sai do mesmo seletor da cena "vídeo" (mural-clip-picker.js) e toca pelo mesmo reprodutor (mural-video-player.js).
 * Tudo injetado: `picker` (mural-clip-picker.js).
 */
function withBackdrop(scene, { picker }) {
  const isSignal = value => typeof value === "symbol" || value == null; // MURAL_SKIP / MURAL_WAIT passam direto
  return {
    ...scene,
    prepare(params, ctx) {
      const attach = prepared => {
        if (isSignal(prepared) || !params.backdrop) return prepared;
        const picked = picker.next(params.backdrop.playlist);
        return { backdrop: typeof picked === "symbol" ? null : picked, prepared };
      };
      const prepared = scene.prepare(params, ctx);
      return typeof prepared?.then === "function" ? prepared.then(attach) : attach(prepared);
    },
    render(wrapped, params) {
      if (!params.backdrop) return scene.render(wrapped, params);
      const { backdrop, prepared } = wrapped;
      const view = scene.render(prepared, params);
      if (!backdrop) return view;
      const video = `<div class="ms-backdrop" aria-hidden="true"><video class="ms-backdrop-el" src="${escapeHtml(backdrop.src)}" muted loop playsinline preload="auto" style="${muralFitVars(backdrop.clip)}"></video></div>`;
      return {
        ...view,
        markup: video + view.markup,
        mount(el, deps) {
          const element = el.querySelector(".ms-backdrop-el");
          const stopPlaying = muralPlayVideo(element, { deps, fail: reason => deps.reportError?.(new Error(`fundo ${backdrop.clip.id}: ${reason}`)) });
          const unmountScene = view.mount?.(el, deps);
          return () => { unmountScene?.(); stopPlaying(); muralReleaseVideo(element); };
        },
      };
    },
  };
}
