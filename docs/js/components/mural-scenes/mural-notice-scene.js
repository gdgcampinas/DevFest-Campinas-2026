/**
 * Cenas do CONTROLE REMOTO do mural (features/mural-control.js): os avisos que o moderador escreve pelo celular e a emergência.
 *   createNoticeScene     os avisos vivos (`ctx.live.notices`, o mais novo grande e os outros embaixo); aviso de "alerta" vem em destaque de atenção. Sem aviso vivo a cena não aparece (MURAL_SKIP).
 *   createEmergencyScene  UM texto em tela cheia (`ctx.live.emergency`), vermelho, que cobre até a moldura: o rodízio fica parado nela até o moderador desarmar.
 * Cada aviso tem um tipo (`kind`, data/mural-config.js): aviso e alerta (texto grande), FRASE do momento (aspas grandes, pra galera postar), CONTAGEM (o texto e um relógio até acontecer algo: foto da galera, sorteio)
 * e PAUSA (também liga o quebra-gelo, ver `liveByKind`). O texto é do moderador: sempre escapado. `nowMs` injetado: o aviso que venceu entre a leitura e a vez da cena não entra.
 */
function createNoticeScene({ nowMs = () => Date.now(), kickers = { info: "Aviso", alert: "Atenção", quote: "Frase do momento", countdown: "Daqui a pouco", break: "Pausa" } } = {}) {
  const countdownText = until => formatMS(Math.max(0, until - nowMs()));
  return {
    prepare(_params, ctx) {
      const alive = (ctx.live.notices ?? []).filter(notice => notice.until > nowMs());
      return alive.length ? [...alive].reverse() : MURAL_SKIP; // o mais novo primeiro
    },
    render([main, ...others]) {
      const rest = others.map((notice, index) => `<li class="ms-notice-item ms-stagger"${muralStagger(index)}>${escapeHtml(notice.text)}</li>`).join("");
      const isCountdown = main.kind === "countdown";
      return {
        markup: `<section class="ms ms-notice" data-kind="${escapeHtml(main.kind)}"><span class="ms-kicker">${escapeHtml(kickers[main.kind] ?? kickers.info)}</span><p class="ms-notice-text">${escapeHtml(main.text)}</p>${isCountdown ? `<p class="ms-number ms-notice-count" data-countdown>${countdownText(main.until)}</p>` : ""}${rest ? `<ul class="ms-notice-list">${rest}</ul>` : ""}</section>`,
        ...(isCountdown ? { mount: (el, deps) => scheduleEvery(deps.schedule, 1000, () => { el.querySelector("[data-countdown]").textContent = countdownText(main.until); }) } : {}),
      };
    },
  };
}

function createEmergencyScene({ label = "Atenção" } = {}) {
  return {
    prepare: (_params, ctx) => ctx.live.emergency ?? MURAL_SKIP,
    render: emergency => ({ markup: `<section class="ms ms-emergency" role="alert"><span class="ms-emergency-label">${escapeHtml(label)}</span><p class="ms-emergency-text">${escapeHtml(emergency.text)}</p></section>` }),
  };
}
