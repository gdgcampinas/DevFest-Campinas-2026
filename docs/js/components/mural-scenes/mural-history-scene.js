/**
 * Cena "10 ANOS DE DEVFEST": um mosaico de fotos da história da comunidade (data/history.js, `mosaic`) com o título e o agradecimento. Os números do título e o ano da fundação entram em destaque
 * (components/number-template.js). REGRA do telão: nunca mostra uma foto sozinha; com menos de `minPhotos` fotos carregadas a cena some (MURAL_SKIP) e volta quando houver.
 * Tudo injetado: `photos` (historyPhotosRepository), `mosaic` (ids), `text` (HISTORY_TEXTS), `years` ({ community, devfest }), `founded` (ano da fundação), `preload` (features/image-preload.js) e `minPhotos`.
 */
function createHistoryScene({ photos, mosaic, text, years, founded, preload, minPhotos = 4 }) {
  return {
    async prepare() {
      const wanted = mosaic.map(id => photos.getById(id)).filter(Boolean);
      const loaded = await Promise.all(wanted.map(photo => preload(photo.file).then(() => photo, () => null)));
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
