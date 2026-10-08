/** Modelo "destaque + 3": uma foto grande à esquerda e três pequenas empilhadas à direita; boa pra álbum com fotos de orientações misturadas. */
const albumFeatureModel = {
  render: ({ items, captionMarkup }) => `<section class="ms ms-album ms-album--feature" data-count="${items.length}"><div class="ms-album-grid">${items.map((item, index) => muralAlbumTileMarkup(item.url, index)).join("")}</div>${captionMarkup}</section>`,
};
