/**
 * ÁLBUNS do Google Fotos que o mural mostra (as FOTOS vêm do intermediário em DevFestIA/tools/album-proxy; os LINKS ficam só no segredo dele, nunca aqui: o repositório é público).
 *   id       o mesmo id do registro do intermediário   |   label: texto da etiqueta na tela   |   enabled: false tira o álbum do mural
 *   live     álbum ao vivo (etiqueta com bolinha "ao vivo"; foto nova entra em destaque, ver data/mural-sources.js)
 *   pollMs   de quanto em quanto tempo o mural relê a lista (ao vivo: 45 s; antigos: 10 min)
 *   order    "newest" (a que entrou por último primeiro), "oldest" ou "shuffle" (embaralha uma vez)
 * Cada cena `album` (data/mural-scenes.js) escolhe o álbum por `params.album`, o modelo (`single`, `collage`, `portrait-strip`, `polaroid`, `feature` ou `auto`) e quantas fotos mostrar.
 */
const MURAL_ALBUMS = [
  { id: "ao-vivo", label: "DevFest 2026 ao vivo", live: true, pollMs: 45000, order: "newest" },
  { id: "elotech-agibank", label: "Elotech Agibank", live: false, pollMs: 600000, order: "shuffle" },
  { id: "devfest-2025", label: "DevFest Campinas 2025", live: false, pollMs: 600000, order: "shuffle" },
];

const muralAlbumsRepository = createRepository(MURAL_ALBUMS, {
  get: id => MURAL_ALBUMS.find(album => album.id === id) ?? null,
  /** Os ligados, ao vivo ou não (a fonte ao vivo lê uns e outros por intervalos diferentes). */
  enabled: ({ live } = {}) => MURAL_ALBUMS.filter(album => album.enabled !== false && (live === undefined || album.live === live)),
});
