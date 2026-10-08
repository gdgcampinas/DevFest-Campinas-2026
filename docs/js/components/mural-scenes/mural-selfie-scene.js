/**
 * Cena "selfie": o telão como PAINEL DE FOTO. A plateia tira foto (estilo Instagram) na frente dele, então esta cena é um cartão-postal: logo e nome do evento
 * enormes, cores fortes, quase nenhum texto miúdo, a fênix de um lado e o outro lado livre pra pessoa ficar na frente. Não anima depois de entrar (movimento borra a foto).
 * `params.hashtag` (vazio por enquanto: a organização ainda não definiu) aparece grande quando preenchida. Fixe com `?cenas=selfie`.
 * Tudo injetado: `preload`, `mascotUrl`, `logoSrc`, `title`, `subtitle`.
 */
function createSelfieScene({ preload, mascotUrl, logoSrc, title, subtitle }) {
  return {
    prepare: () => preload(mascotUrl),
    render(_prepared, params) {
      const hashtag = params.hashtag ? `<p class="ms-selfie-tag">${escapeHtml(params.hashtag)}</p>` : "";
      return { markup: `<section class="ms ms-selfie"><div class="ms-selfie-brand"><img class="ms-selfie-logo" src="${escapeHtml(logoSrc)}" alt=""><h2 class="ms-selfie-title">${escapeHtml(title)}</h2><p class="ms-selfie-date">${escapeHtml(subtitle)}</p>${hashtag}${params.hint ? `<p class="ms-selfie-hint">${escapeHtml(params.hint)}</p>` : ""}</div><img class="ms-selfie-mascot" src="${escapeHtml(mascotUrl)}" alt=""></section>` };
    },
  };
}
