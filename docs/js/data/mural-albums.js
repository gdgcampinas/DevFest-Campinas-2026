/**
 * ÁLBUNS do Google Fotos que o mural mostra (as FOTOS vêm do intermediário em DevFestIA/tools/album-proxy; os LINKS ficam só no segredo dele, nunca aqui: o repositório é público).
 *   id       o mesmo id do registro do intermediário   |   label: texto da etiqueta na tela   |   enabled: false tira o álbum do mural
 *   live     álbum ao vivo (etiqueta com bolinha "ao vivo"; foto nova entra em destaque, ver data/mural-sources.js)
 *   pollMs   de quanto em quanto tempo o mural relê a lista (ao vivo: 45 s; antigos: 10 min)
 *   approval true = a foto só vai ao telão DEPOIS de o moderador aprová-la (Firestore `mural-approved/<álbum>`, tela Fotos do admin: abas Pendentes, No ar e Fora do ar); sem isso, vale o contrário: entra sozinha e o moderador pode tirar do ar
 *   order    "newest" (a que entrou por último primeiro), "oldest" ou "shuffle" (embaralha uma vez)
 * Cada cena `album` (data/mural-scenes.js) escolhe o álbum por `params.album`, o modelo (`collage`, `portrait-strip`, `polaroid`, `feature`, `mosaic` ou `auto`) e quantas fotos mostrar.
 */
const MURAL_ALBUMS = [
  { id: "ao-vivo", label: "DevFest 2026 ao vivo", live: true, pollMs: 45000, order: "newest", approval: true },
  { id: "elotech-agibank", label: "Elotech Agibank", live: false, pollMs: 600000, order: "shuffle" },
  { id: "devfest-2025", label: "DevFest Campinas 2025", live: false, pollMs: 600000, order: "shuffle" },
  { id: "gdg-talks-bosch-2026", label: "GDG Talks · Bosch 2026", live: false, pollMs: 600000, order: "shuffle" },
];

const muralAlbumsRepository = createRepository(MURAL_ALBUMS, {
  get: id => MURAL_ALBUMS.find(album => album.id === id) ?? null,
  /** Os ligados que só mostram foto aprovada (`approval: true`): são os que o telão ouve em `mural-approved`. */
  withApproval: () => MURAL_ALBUMS.filter(album => album.enabled !== false && album.approval === true),
  /** Os ligados, ao vivo ou não (a fonte ao vivo lê uns e outros por intervalos diferentes). */
  enabled: ({ live } = {}) => MURAL_ALBUMS.filter(album => album.enabled !== false && (live === undefined || album.live === live)),
});
