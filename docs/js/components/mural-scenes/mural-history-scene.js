/**
 * Cena "10 ANOS DE DEVFEST": um mosaico de fotos da história da comunidade (data/history.js, `mosaic`) com o título e o agradecimento. O mosaico tem MUITAS fotos, então cada passada mostra uma
 * página de no máximo `perPage` (equilibradas; a próxima a cada vez, por features/mural-rotation.js) e, ao longo do dia, todas aparecem. Os números do título e o ano da fundação entram em destaque (components/number-template.js).
 * REGRA do telão: nunca mostra uma foto sozinha; com menos de `minPhotos` fotos carregadas na página a cena some (MURAL_SKIP) e volta quando houver.
 * Tudo injetado: `photos` (historyPhotosRepository), `mosaic` (ids), `text` (HISTORY_TEXTS), `years`, `founded`, `perPage`, `rotation`, `preload` (features/image-preload.js) e `minPhotos`.
 */
function createHistoryScene({ photos, mosaic, text, years, founded, perPage = 8, rotation, preload, minPhotos = 4 }) {
  const all = mosaic.map(id => photos.getById(id)).filter(Boolean);
  const pageCount = Math.ceil(all.length / perPage);
  const size = Math.ceil(all.length / (pageCount || 1)); // páginas equilibradas: a última nunca fica com 1 ou 2 fotos (que a regra do telão esconderia)
  const pages = Array.from({ length: pageCount }, (_, index) => all.slice(index * size, (index + 1) * size));
  return {
    async prepare() {
      if (!pages.length) return MURAL_SKIP;
      const page = pages[rotation.next("history", pages.length)];
      const loaded = await Promise.all(page.map(photo => preload(photo.file).then(() => photo, () => null)));
      const ready = loaded.filter(Boolean);
      return ready.length >= minPhotos ? ready : MURAL_SKIP;
    },
    render(ready) {
      const tiles = ready.map((photo, index) => `<figure class="ms-history-tile ms-stagger"${muralStagger(index)}><img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.alt)}"></figure>`).join("");
      return {
        markup: `<section class="ms ms-history">
          <header class="ms-head"><span class="ms-kicker">${escapeHtml(text.kicker)}</span><h2 class="ms-title">${numberTemplateMarkup(text.sceneTitle, years)}</h2></header>
          <div class="ms-history-grid" data-count="${ready.length}">${tiles}</div>
          <p class="ms-hint ms-history-thanks">${numberTemplateMarkup(text.sceneThanks, { founded })}</p>
        </section>`,
      };
    },
  };
}
