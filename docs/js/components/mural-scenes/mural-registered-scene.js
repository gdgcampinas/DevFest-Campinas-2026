/**
 * Cena do número de inscritos (o único número público do evento, `event-stats`): só aparece com o total lido e acima do mínimo (EVENT.tickets.counterMin),
 * como o contador do site. O número SOBE de 0 até o total (features/count-up.js); se a animação falhar, o total já está no HTML.
 * Tudo injetado: `format` e `motion` (MURAL_CONFIG.motion: countUpMs, countUpStepMs).
 */
function createRegisteredScene({ format = number => number.toLocaleString("pt-BR"), motion = { countUpMs: 1800, countUpStepMs: 40 } } = {}) {
  return {
    prepare(params, ctx) {
      const total = ctx.live.registered?.total;
      return total >= params.min ? total : MURAL_SKIP;
    },
    render(total) {
      return { markup: `<section class="ms ms-big"><span class="ms-kicker">Já garantiram a vaga</span><p class="ms-number" data-count-up>${format(total)}</p><p class="ms-hint">pessoas no DevFest Campinas</p></section>`,
        mount: (el, deps) => runCountUp({ schedule: deps.schedule, total, durationMs: motion.countUpMs, stepMs: motion.countUpStepMs, onValue: value => { el.querySelector("[data-count-up]").textContent = format(value); } }),
      };
    },
  };
}
