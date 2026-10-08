/** Modelo "foto única": uma foto grande em tela cheia (com o fundo desfocado e o zoom lento). `moves` = createMoveCycle(MURAL_CONFIG.motion.kenBurns). */
function createSingleAlbumModel({ moves }) {
  return {
    render: ({ items, captionMarkup }) => muralPhotoMarkup({ url: items[0].url, captionMarkup, moveStyle: moves.next() }),
  };
}
