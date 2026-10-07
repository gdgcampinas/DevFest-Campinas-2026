/**
 * Cena da fênix (Gumbleton, o mascote do GDG Campinas), imagem estática por enquanto (a animada é a Fase 3). Pré-carrega a imagem; se falhar a cena descansa.
 * Tudo injetado: `preload`, `imageUrl`, `title` e `subtitle` (o nome e a data do evento, calculados na composição da página).
 */
function createPhoenixScene({ preload, imageUrl, title, subtitle }) {
  return {
    prepare: () => preload(imageUrl),
    render() {
      return { markup: `<section class="ms ms-phoenix"><img class="ms-phoenix-img" src="${escapeHtml(imageUrl)}" alt="Gumbleton, a fênix do GDG Campinas"><div class="ms-phoenix-text"><span class="ms-kicker">GDG Campinas</span><h2 class="ms-title">${escapeHtml(title)}</h2><p class="ms-hint">${escapeHtml(subtitle)}</p></div></section>` };
    },
  };
}
