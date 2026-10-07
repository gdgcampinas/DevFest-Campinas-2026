/** Cena do número de inscritos (o único número público do evento, `event-stats`): só aparece com o total lido e acima do mínimo (EVENT.tickets.counterMin), como o contador do site. */
function createRegisteredScene({ format = number => number.toLocaleString("pt-BR") } = {}) {
  return {
    prepare(params, ctx) {
      const total = ctx.live.registered?.total;
      return total >= params.min ? total : MURAL_SKIP;
    },
    render(total) {
      return { markup: `<section class="ms ms-big"><span class="ms-kicker">Já garantiram a vaga</span><p class="ms-number">${format(total)}</p><p class="ms-hint">pessoas no DevFest Campinas</p></section>` };
    },
  };
}
