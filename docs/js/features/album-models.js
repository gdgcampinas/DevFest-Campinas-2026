/**
 * Escolha do MODELO de exibição de um álbum (puro, dual: navegador e Node). Os modelos são dado (data/mural-album-models.js): quantas fotos, tamanho pedido de cada uma,
 * orientação preferida. `model: "auto"` na cena olha as fotos do álbum e escolhe o que combina: álbum de retratos (celular em pé, como o do Elotech Agibank, 93% retrato)
 * vira faixa de retratos; de paisagens vira colagem; misto vira destaque com três. Nunca pede um modelo que o dado não tem.
 */
function chooseAlbumModel({ model = "auto", photos, models, autoRules }) {
  if (model !== "auto") {
    if (!models[model]) throw new Error(`modelo de álbum desconhecido: ${model}`);
    return { id: model, ...models[model] };
  }
  const share = orientationShare(photos);
  const id = share.portrait >= autoRules.portraitMin ? autoRules.portrait : share.landscape >= autoRules.landscapeMin ? autoRules.landscape : autoRules.mixed;
  return { id, ...models[id] };
}

/**
 * Ordem em que as fotos de um álbum entram na fila: "newest" (como vêm do intermediário, a que entrou por último primeiro: álbum ao vivo), "oldest" ou "shuffle" (embaralha uma vez,
 * pra álbuns de eventos passados não repetirem sempre a mesma foto de abertura). `random` injetável pro teste.
 */
function orderAlbumPhotos(photos, order = "newest", random = Math.random) {
  if (order === "oldest") return [...photos].reverse();
  if (order !== "shuffle") return photos;
  const list = [...photos];
  for (let index = list.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [list[index], list[other]] = [list[other], list[index]];
  }
  return list;
}

if (typeof module !== "undefined") module.exports = { chooseAlbumModel, orderAlbumPhotos };
