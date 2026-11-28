/**
 * Cena de ARTE: uma peça pronta de design em tela cheia. `params.art` é o id em data/mural-arts.js, que diz como a arte se adapta a
 * qualquer proporção de telão (cover ou contain, ponto de foco por forma). Com `params.pool` (lista de ids) a cena SORTEIA uma arte a cada passada,
 * sem repetir antes de todas terem passado (e sem repetir a mesma duas vezes seguidas na virada do saco); todas as cenas que usam a mesma lista dividem o mesmo saco.
 * Com `params.fullStage` a arte cobre o palco inteiro, sem margem nem rodapé (peça que já traz os dela).
 * A imagem é pré-carregada com tempo limite: se não carregar a cena falha e descansa (a próxima passada sorteia outra).
 * Tudo injetado: `repository` (muralArtsRepository), `preload` (features/image-preload.js) e `random` (Math.random por padrão; os testes passam um fixo).
 */
function createArtScene({ repository, preload, random = Math.random }) {
  const bags = new Map();
  let last = null;
  const artOf = id => {
    const art = repository.get(id);
    if (!art) throw new Error(`arte desconhecida: ${id}`);
    return art;
  };
  /** Tira o próximo id do saco da lista (embaralhado de novo quando esvazia). */
  const draw = pool => {
    const key = pool.join("|");
    let bag = bags.get(key) ?? [];
    if (!bag.length) {
      bag = [...pool];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag.length > 1 && bag[bag.length - 1] === last) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    const id = bag.pop();
    bags.set(key, bag);
    last = id;
    return id;
  };
  return {
    async prepare(params) {
      const art = artOf(params.pool?.length ? draw(params.pool) : params.art);
      await preload(art.file);
      return art;
    },
    render(art, params = {}) {
      return { markup: `<section class="ms ms-art${params.fullStage ? " ms-full-stage" : ""}">${muralArtMarkup(art)}</section>` };
    },
  };
}
