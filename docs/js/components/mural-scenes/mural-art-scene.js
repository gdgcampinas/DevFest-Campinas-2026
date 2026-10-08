/**
 * Cena de ARTE: uma peça pronta de design em tela cheia (convite, banner, Gumbleton). `params.art` é o id em data/mural-arts.js, que diz como a arte se adapta a
 * qualquer proporção de telão (cover ou contain, ponto de foco por forma). A imagem é pré-carregada com tempo limite: se não carregar a cena falha e descansa.
 * Tudo injetado: `repository` (muralArtsRepository) e `preload` (features/image-preload.js).
 */
function createArtScene({ repository, preload }) {
  const artOf = params => {
    const art = repository.get(params.art);
    if (!art) throw new Error(`arte desconhecida: ${params.art}`);
    return art;
  };
  return {
    async prepare(params) {
      const art = artOf(params);
      await preload(art.file);
      return art;
    },
    render(art) {
      return { markup: `<section class="ms ms-art">${muralArtMarkup(art)}</section>` };
    },
  };
}
