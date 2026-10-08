/** Modelo "mural de polaroides": fotos soltas com borda branca e um giro diferente cada, como coladas num mural. `rotations` (graus) vem do dado do modelo. */
function createPolaroidAlbumModel({ rotations }) {
  return {
    render: ({ items, captionMarkup }) => `<section class="ms ms-album ms-album--polaroid" data-count="${items.length}"><div class="ms-album-grid">${items.map((item, index) => muralAlbumTileMarkup(item.url, index, `--rot:${rotations[index % rotations.length]}deg`)).join("")}</div>${captionMarkup}</section>`,
  };
}
