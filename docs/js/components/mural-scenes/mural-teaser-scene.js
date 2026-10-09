/**
 * Cena "Daqui a pouco": a atração grande que começa primeiro dentro da janela de aviso (features/mural-teasers.js), com a contagem andando em minutos e segundos e o convite do dado.
 * Fora da janela de qualquer atração a cena não aparece (MURAL_SKIP). Tudo injetado: `repository` (data/mural-teasers.js: enabled), `schedule` (a grade). A contagem anda sozinha (relógio da cena).
 */
function createTeaserScene({ repository, schedule }) {
  const countdown = ms => formatMS(Math.max(0, ms));
  return {
    prepare(_params, ctx) {
      return nextTeaser({ teasers: repository.enabled(), schedule, now: ctx.now }) ?? MURAL_SKIP;
    },
    render({ teaser, startsAt }, _params, ctx) {
      return {
        markup: `<section class="ms ms-big ms-teaser"><span class="ms-kicker">${escapeHtml(teaser.kicker ?? "Daqui a pouco")}</span><h2 class="ms-title ms-teaser-title">${escapeHtml(teaser.title)}</h2><p class="ms-number" data-countdown>${countdown(startsAt - ctx.now)}</p><p class="ms-hint">${escapeHtml(teaser.call)}</p></section>`,
        mount: (el, deps) => scheduleEvery(deps.schedule, 1000, () => { el.querySelector("[data-countdown]").textContent = countdown(startsAt - deps.clock()); }),
      };
    },
  };
}
