/**
 * Cenas de fase do evento: `params.kind` = "countdown" (antes de abrir: contagem regressiva que anda sozinha) ou "thanks" (depois do fim: agradecimento).
 * Quem decide em que fase cada uma aparece é o dado (`requires.phases`). Tudo injetado: `schedule` (a grade), `title`.
 */
function createEventPhaseScene({ schedule, title }) {
  const countdownText = now => formatDaysHMS(Math.max(0, schedule[0].start - now));
  return {
    render(_prepared, params, ctx) {
      if (params.kind === "countdown") {
        return {
          markup: `<section class="ms ms-big"><span class="ms-kicker">Falta pouco</span><p class="ms-number" data-countdown>${countdownText(ctx.now)}</p><p class="ms-hint">para o ${escapeHtml(title)}</p></section>`,
          mount: (el, deps) => scheduleEvery(deps.schedule, 1000, () => { el.querySelector("[data-countdown]").textContent = countdownText(deps.clock()); }),
        };
      }
      return { markup: `<section class="ms ms-big"><span class="ms-kicker">Obrigado!</span><p class="ms-number ms-number--text">Até a próxima edição</p><p class="ms-hint">${escapeHtml(title)}</p></section>` };
    },
  };
}
