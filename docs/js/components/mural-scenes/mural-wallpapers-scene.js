/**
 * Cena de FUNDOS DE TELA: três celulares com os fundos do evento (data/wallpapers.js, a mesma lista da página fundos.html) e um QR grande que leva a ela. A cada passada mostra os três
 * seguintes da lista (com mais de três fundos, cada volta do rodízio traz outros). O título, a dica e o destino do QR vêm por dado (`params`, como na cena de QR). Sem destino, sem fundos ou sem a
 * biblioteca de QR a cena não aparece. Tudo injetado: `repository` (wallpapersRepository), `preload`, `targets` (features/qr-targets.js), `qr` (features/qr-renderer.js) e `lock` ({ time, date }:
 * o relógio e a data que enfeitam a tela de bloqueio dos celulares, só ilustração).
 */
function createWallpapersScene({ repository, preload, targets, qr, lock, perPass = 3 }) {
  let pass = 0;
  const nextBatch = list => {
    const start = (pass++ * perPass) % list.length;
    return Array.from({ length: Math.min(perPass, list.length) }, (_, index) => list[(start + index) % list.length]);
  };
  return {
    async prepare(params) {
      if (!qr.available()) throw new Error("biblioteca de QR indisponível");
      const target = targets.resolve(params);
      const wallpapers = repository.getAll();
      if (!target || wallpapers.length === 0) return MURAL_SKIP;
      const batch = nextBatch(wallpapers);
      await Promise.all(batch.map(item => preload(item.image)));
      return { target, batch };
    },
    render({ target, batch }, params) {
      const phones = batch.map((item, index) => `
        <div class="ms-wp-phone ms-stagger"${muralStagger(index)}>
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">
          <span class="ms-wp-lock"><b>${escapeHtml(lock.time)}</b><small>${escapeHtml(lock.date)}</small></span>
        </div>`).join("");
      return {
        markup: `<section class="ms ms-wallpapers">
          <div class="ms-wp-main">${muralHeadMarkup({ kicker: params.kicker, title: params.heading })}<div class="ms-wp-phones">${phones}</div></div>
          <aside class="ms-wp-qr"><div class="ms-qr-code" data-qr></div><p class="ms-hint">${escapeHtml(params.hint)}</p></aside>
        </section>`,
        mount: el => { qr.draw(el.querySelector("[data-qr]"), target.url); },
      };
    },
  };
}
