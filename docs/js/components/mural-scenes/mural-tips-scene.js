/** Cena de dicas e avisos: os itens ativos de `repository` (data/mural-tips.js), até `params.max` (padrão 4), em cartões com ícone. Sem item ativo, a cena não aparece (MURAL_SKIP). */
function createTipsScene({ repository }) {
  return {
    prepare(params, ctx) {
      const items = repository.getActive(ctx.now).slice(0, params.max ?? 4);
      return items.length ? items : MURAL_SKIP;
    },
    render(items, params) {
      const cards = items.map((tip, index) => `<li class="ms-tip ms-stagger"${muralStagger(index)}>${iconMarkup(tip.icon, "ms-tip-icon")}<h3>${escapeHtml(tip.title)}</h3><p>${escapeHtml(tip.text)}</p></li>`).join("");
      return { markup: `<section class="ms ms-tips">${muralHeadMarkup({ kicker: "Dicas", title: params.title })}<ul class="ms-tip-list" data-count="${items.length}">${cards}</ul></section>` };
    },
  };
}
