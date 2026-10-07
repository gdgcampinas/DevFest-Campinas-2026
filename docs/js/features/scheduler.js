/**
 * Agendador injetável: tudo que espera tempo (rodízio do mural, vigia, tentativas de rede) recebe um `schedule(fn, ms)` que devolve a
 * função que cancela. Em produção é o setTimeout; nos testes é o relógio falso (DevFestIA/tools/lib/fake-clock.js), que anda
 * horas em milissegundos. Arquivo "dual" (navegador e Node). Pura, sem DOM.
 */
function defaultSchedule(fn, ms) {
  const id = setTimeout(fn, ms);
  return () => clearTimeout(id);
}

/** Roda `fn` agora e a cada `ms`, no `schedule` injetado; devolve a função que pára (serve de `dispose` de cena: relógio, contagem). */
function scheduleEvery(schedule, ms, fn) {
  let cancel = () => {};
  const tick = () => {
    fn();
    cancel = schedule(tick, ms);
  };
  tick();
  return () => cancel();
}

/**
 * Resolve com o valor de `work` (promise ou valor comum) ou rejeita se passar de `ms`. Sem isso uma promise que nunca resolve (foto que
 * trava, rede muda) pararia o rodízio pra sempre. O tempo corre no `schedule` injetado.
 */
function withTimeout(work, ms, schedule = defaultSchedule, message = "tempo esgotado") {
  return new Promise((resolve, reject) => {
    const cancel = schedule(() => reject(new Error(message)), ms);
    Promise.resolve(work).then(
      value => { cancel(); resolve(value); },
      error => { cancel(); reject(error); }
    );
  });
}

if (typeof module !== "undefined") module.exports = { defaultSchedule, scheduleEvery, withTimeout };
