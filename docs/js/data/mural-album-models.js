/**
 * MODELOS de exibição de álbum do mural (data/mural-albums.js escolhe o álbum, a cena escolhe o modelo, este arquivo diz o que cada modelo pede). Trocar quantidade de fotos,
 * tamanho ou orientação é editar aqui; um modelo novo é uma entrada aqui + um arquivo em components/mural-scenes/album-models/ + o registro em pages/mural.js.
 *   count    quantas fotos o modelo mostra de cada vez   |   prefer: orientação preferida ("portrait", "landscape" ou "any"): escolhe primeiro as que combinam, completa com as outras
 *   min      menos fotos que isso a cena NÃO aparece (MURAL_SKIP): o telão nunca mostra uma foto sozinha nem uma grade capenga (álbum ao vivo ainda enchendo); a única tela com uma imagem só é a arte (selfie)
 *   tiles    tamanho pedido ao Google pra cada foto (a colagem não baixa 4 MB pra um quadrinho); se faltar item, repete o último
 *   rotations (só polaroide) giro de cada foto em graus
 * `auto` (na cena) escolhe pelo álbum: maioria retrato -> faixa de retratos, maioria paisagem -> colagem, misto -> destaque (MURAL_ALBUM_AUTO).
 */
const MURAL_ALBUM_MODELS = {
  collage: { count: 6, min: 4, prefer: "landscape", tiles: [{ width: 960, height: 640 }] },
  "portrait-strip": { count: 4, min: 3, prefer: "portrait", tiles: [{ width: 640, height: 960 }] },
  polaroid: { count: 5, min: 3, prefer: "any", tiles: [{ width: 800, height: 800 }], rotations: [-5, 3, -2, 4, -3] },
  feature: { count: 4, min: 4, prefer: "any", tiles: [{ width: 1400, height: 1000 }, { width: 640, height: 420 }] },
  mosaic: { count: 12, min: 8, prefer: "any", tiles: [{ width: 640, height: 640 }] },
};

const MURAL_ALBUM_AUTO = { portraitMin: 0.6, landscapeMin: 0.6, portrait: "portrait-strip", landscape: "collage", mixed: "feature" };

const muralAlbumModelsRepository = createRepository(MURAL_ALBUM_MODELS, { auto: () => MURAL_ALBUM_AUTO });
