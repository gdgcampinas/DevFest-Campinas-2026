/**
 * Um espaço da página que mostra um aviso só enquanto ele vale: some e volta sozinho. Confere a cada `refreshMs` (no `timer` injetado) e redesenha com `render()`,
 * que devolve o HTML do aviso ou "" quando não vale (então o espaço fica escondido). `subscribe` (opcional, ex.: `favoritesRepository.subscribe`) redesenha também na hora em que o dado muda.
 * Usado pelos convites do mural de recados e do álbum ao vivo e pela divulgação da "Minha agenda" (features/agenda-promo.js).
 */
function initInviteSlot(mountEl, { render, timer = defaultSchedule, refreshMs = 30000, subscribe = null }) {
  const draw = () => {
    const markup = render();
    mountEl.hidden = !markup;
    mountEl.innerHTML = markup;
  };
  const stopTimer = scheduleEvery(timer, refreshMs, draw);
  const unsubscribe = subscribe ? subscribe(draw) : null;
  return { stop: () => { stopTimer(); if (typeof unsubscribe === "function") unsubscribe(); } };
}
