/** Modelo "faixa de retratos": fotos em pé lado a lado, cada uma ocupando a altura toda; é o que um álbum feito de celular em pé (retrato) pede num telão deitado. */
const albumPortraitStripModel = {
  render: ({ items, captionMarkup }) => `<section class="ms ms-album ms-album--strip" data-count="${items.length}"><div class="ms-album-grid">${items.map((item, index) => muralAlbumTileMarkup(item.url, index)).join("")}</div>${captionMarkup}</section>`,
};
