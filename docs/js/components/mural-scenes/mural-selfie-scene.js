/**
 * Cena "selfie": o telão como PAINEL DE FOTO. A plateia tira foto (estilo Instagram) na frente dele, então esta cena é um cartão-postal: cores fortes, quase nenhum texto miúdo,
 * espaço livre pra pessoa ficar na frente. Não anima depois de entrar (movimento borra a foto). Fixe com `?cenas=selfie`.
 *   com `params.art`  (id em data/mural-arts.js) a arte vira o fundo e o nome do evento e a data ficam numa faixa embaixo, longe do logo que já vem na arte;
 *   sem `params.art`  desenha o cartão com logo, nome, data e a fênix.
 * `params.hashtag` (vazio por enquanto: a organização ainda não definiu) aparece grande quando preenchida; `params.hint` é uma frase de apoio opcional.
 * Tudo injetado: `preload`, `arts` (muralArtsRepository), `mascotUrl`, `logoSrc`, `title`, `subtitle`.
 */
function createSelfieScene({ preload, arts, mascotUrl, logoSrc, title, subtitle }) {
  const artOf = params => (params.art ? arts.get(params.art) : null);
  return {
    prepare: params => preload(artOf(params)?.file ?? mascotUrl),
    render(_prepared, params) {
      const art = artOf(params);
      const hashtag = params.hashtag ? `<p class="ms-selfie-tag">${escapeHtml(params.hashtag)}</p>` : "";
      const hint = params.hint ? `<p class="ms-selfie-hint">${escapeHtml(params.hint)}</p>` : "";
      if (art) {
        return { markup: `<section class="ms ms-selfie ms-selfie--art">${muralArtMarkup(art)}<div class="ms-selfie-bar"><h2 class="ms-selfie-title">${escapeHtml(title)}</h2><p class="ms-selfie-date">${escapeHtml(subtitle)}</p>${hashtag}${hint}</div></section>` };
      }
      return { markup: `<section class="ms ms-selfie"><div class="ms-selfie-brand"><img class="ms-selfie-logo" src="${escapeHtml(logoSrc)}" alt=""><h2 class="ms-selfie-title">${escapeHtml(title)}</h2><p class="ms-selfie-date">${escapeHtml(subtitle)}</p>${hashtag}${hint}</div><img class="ms-selfie-mascot" src="${escapeHtml(mascotUrl)}" alt=""></section>` };
    },
  };
}
