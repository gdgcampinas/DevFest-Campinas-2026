/** Modelo "mosaico": uma parede de fotos pequenas (padrão 12), como o telão de um evento cheio de gente; o CSS refaz as colunas pela forma do telão. */
const albumMosaicModel = {
  render: ({ items, captionMarkup }) => `<section class="ms ms-album ms-album--mosaic" data-count="${items.length}"><div class="ms-album-grid">${items.map((item, index) => muralAlbumTileMarkup(item.url, index)).join("")}</div>${captionMarkup}</section>`,
};
