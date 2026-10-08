/** Modelo "colagem": uma grade de fotos (padrão 3 x 2) entrando em fila; boa pra álbum de paisagens. */
const albumCollageModel = {
  render: ({ items, captionMarkup }) => `<section class="ms ms-album ms-album--collage" data-count="${items.length}"><div class="ms-album-grid">${items.map((item, index) => muralAlbumTileMarkup(item.url, index)).join("")}</div>${captionMarkup}</section>`,
};
