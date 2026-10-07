/**
 * Cena de RESERVA: o que o mural mostra quando nenhuma outra cena pode ou quando tudo falha. Não depende de rede nem de dado ao vivo: só do que já
 * está na memória (logo, nome, data, relógio e, se o line-up estiver revelado, o que está no ar). Por isso é desenhada de forma simples e à prova de erro.
 * Tudo injetado: `logoSrc`, `title`, `subtitle`, `schedule`, `tracks`, `timezone`, `phaseOf`.
 */
function createReserveScene({ logoSrc, title, subtitle, schedule, tracks, timezone, phaseOf }) {
  const nowLines = (ctx) => {
    if (!ctx.reveal) return "";
    const board = resolveNowAndNext({ schedule, tracks, now: ctx.now, phaseOf });
    const lines = board.columns.filter(column => column.current).map(column => `<li style="--track-color:${column.track.color}"><b>${escapeHtml(column.track.shortLabel ?? column.track.label)}</b> ${escapeHtml(column.current.title)}</li>`);
    return lines.length ? `<ul class="ms-reserve-now">${lines.join("")}</ul>` : "";
  };
  return {
    render(_prepared, _params, ctx) {
      const offline = ctx.network?.online === false ? `<p class="ms-reserve-offline">Sem internet no momento. O mural volta sozinho.</p>` : "";
      return {
        markup: `<section class="ms ms-reserve"><img class="ms-reserve-logo" src="${escapeHtml(logoSrc)}" alt=""><h2 class="ms-title">${escapeHtml(title)}</h2><p class="ms-hint">${escapeHtml(subtitle)}</p><p class="ms-reserve-clock" data-clock></p>${nowLines(ctx)}${offline}</section>`,
        mount: (el, deps) => scheduleEvery(deps.schedule, 1000, () => { el.querySelector("[data-clock]").textContent = formatEventTime(deps.clock(), timezone); }),
      };
    },
  };
}
