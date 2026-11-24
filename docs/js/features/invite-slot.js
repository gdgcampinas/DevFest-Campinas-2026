/**
 * Um espaço da página que mostra um convite só enquanto ele vale: some e volta sozinho. Confere a cada `refreshMs` (no `timer` injetado) e redesenha com `render()`,
 * que devolve o HTML do convite ou "" quando não vale (então o espaço fica escondido). Usado pelos convites do mural de recados e do álbum ao vivo.
 */
function initInviteSlot(mountEl, { render, timer = defaultSchedule, refreshMs = 30000 }) {
  return { stop: scheduleEvery(timer, refreshMs, () => {
    const markup = render();
    mountEl.hidden = !markup;
    mountEl.innerHTML = markup;
  }) };
}
