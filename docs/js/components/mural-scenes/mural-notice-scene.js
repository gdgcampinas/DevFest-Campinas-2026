/**
 * Cenas do CONTROLE REMOTO do mural (features/mural-control.js): os avisos que o moderador escreve pelo celular e a emergência.
 *   createNoticeScene     os avisos vivos (`ctx.live.notices`, o mais novo grande e os outros embaixo); aviso de "alerta" vem em destaque de atenção. Sem aviso vivo a cena não aparece (MURAL_SKIP).
 *   createEmergencyScene  UM texto em tela cheia (`ctx.live.emergency`), vermelho, que cobre até a moldura: o rodízio fica parado nela até o moderador desarmar.
 * O texto é do moderador: sempre escapado. `nowMs` injetado: o aviso que venceu entre a leitura e a vez da cena não entra.
 */
function createNoticeScene({ nowMs = () => Date.now(), kickers = { info: "Aviso", alert: "Atenção" } } = {}) {
  return {
    prepare(_params, ctx) {
      const alive = (ctx.live.notices ?? []).filter(notice => notice.until > nowMs());
      return alive.length ? [...alive].reverse() : MURAL_SKIP; // o mais novo primeiro
    },
    render([main, ...others]) {
      const rest = others.map((notice, index) => `<li class="ms-notice-item ms-stagger"${muralStagger(index)}>${escapeHtml(notice.text)}</li>`).join("");
      return { markup: `<section class="ms ms-notice" data-kind="${escapeHtml(main.kind)}"><span class="ms-kicker">${escapeHtml(kickers[main.kind] ?? kickers.info)}</span><p class="ms-notice-text">${escapeHtml(main.text)}</p>${rest ? `<ul class="ms-notice-list">${rest}</ul>` : ""}</section>` };
    },
  };
}

function createEmergencyScene({ label = "Atenção" } = {}) {
  return {
    prepare: (_params, ctx) => ctx.live.emergency ?? MURAL_SKIP,
    render: emergency => ({ markup: `<section class="ms ms-emergency" role="alert"><span class="ms-emergency-label">${escapeHtml(label)}</span><p class="ms-emergency-text">${escapeHtml(emergency.text)}</p></section>` }),
  };
}
