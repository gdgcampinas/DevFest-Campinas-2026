/**
 * Peças puras do mural pra álbuns do Google Fotos: fila de fotos (por álbum, por orientação), endereço com tamanho, orientação, detector de foto nova e escolha do modelo.
 *   node --test DevFestIA/tools/mural/album-helpers.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { createPhotoPool } = load("features/mural-photo-pool.js");
const { albumPhotoUrl, photoOrientation, orientationShare } = load("features/album-photo-url.js");
globalThis.orientationShare = orientationShare;
const { createNewItemsDetector } = load("features/new-items-detector.js");
const { chooseAlbumModel } = load("features/album-models.js");

const photo = (id, width, height) => ({ id, url: `https://lh3/pw/${id}`, width, height });
const keyOf = item => item.id;

test("fila de álbum: identidade pelo id, rodízio em ordem e castigo por foto", () => {
  let time = 0;
  const photos = [photo("a", 100, 50), photo("b", 100, 50), photo("c", 100, 50)];
  const pool = createPhotoPool({ photos, nowMs: () => time, quarantineMs: 1000, keyOf });
  assert.deepEqual([1, 2, 3, 4].map(() => pool.next().id), ["a", "b", "c", "a"]);
  pool.reportFailure(photos[1]);
  assert.equal(pool.usable(), 2);
  assert.deepEqual([1, 2, 3].map(() => pool.next().id), ["c", "a", "c"]);
  time = 1001;
  assert.equal(pool.usable(), 3);
});

test("take: devolve N fotos distintas, as da orientação preferida primeiro, completando com as outras", () => {
  const photos = [photo("p1", 50, 100), photo("l1", 100, 50), photo("p2", 50, 100), photo("l2", 100, 50), photo("p3", 50, 100)];
  const pool = createPhotoPool({ photos, nowMs: () => 0, quarantineMs: 1, keyOf });
  const portraits = photo => photoOrientation(photo) === "portrait";
  assert.deepEqual(pool.take(2, portraits).map(keyOf), ["p1", "p2"]);
  assert.deepEqual(pool.take(2, portraits).map(keyOf), ["p3", "p1"], "continua de onde parou e dá a volta");
  assert.deepEqual(pool.take(5, portraits).length, 5, "pediu mais retratos do que existem: completa com paisagens, sem repetir");
  assert.equal(new Set(pool.take(5).map(keyOf)).size, 5);
});

test("take: lista menor que o pedido devolve o que tem; sem nada utilizável devolve vazio", () => {
  const pool = createPhotoPool({ photos: [photo("a", 1, 1), photo("b", 1, 1)], nowMs: () => 0, quarantineMs: 1000, keyOf });
  assert.equal(pool.take(6).length, 2);
  pool.reportFailure(photo("a", 1, 1));
  pool.reportFailure(photo("b", 1, 1));
  assert.deepEqual(pool.take(3), []);
  assert.equal(createPhotoPool({ photos: [], nowMs: () => 0, quarantineMs: 1, keyOf }).take(3).length, 0);
});

test("replace: lista nova (álbum ao vivo ganhou foto); com restart as mais novas vêm primeiro; castigos continuam", () => {
  const first = [photo("c", 1, 1), photo("b", 1, 1), photo("a", 1, 1)];
  const pool = createPhotoPool({ photos: first, nowMs: () => 0, quarantineMs: 1000, keyOf });
  pool.next();
  pool.next();
  pool.reportFailure(photo("z", 1, 1));
  pool.replace([photo("z", 1, 1), photo("d", 1, 1), ...first], { restart: true });
  assert.equal(pool.next().id, "d", "a nova foi pro começo e o 'z' está de castigo");
  pool.replace([photo("d", 1, 1)]);
  assert.equal(pool.next().id, "d", "sem restart o cursor continua válido numa lista menor");
  pool.replace([]);
  assert.equal(pool.next(), null);
});

test("endereço com tamanho e orientação", () => {
  assert.equal(albumPhotoUrl(photo("a", 1, 1), { width: 1920, height: 1080 }), "https://lh3/pw/a=w1920-h1080");
  assert.equal(albumPhotoUrl(photo("a", 1, 1), { width: 959.6, height: 640.2 }), "https://lh3/pw/a=w960-h640");
  assert.deepEqual([photo("a", 4000, 3000), photo("b", 3000, 5333), photo("c", 1000, 1000), photo("d", 1000, 1040)].map(photoOrientation), ["landscape", "portrait", "square", "square"]);
  const share = orientationShare([photo("a", 2, 1), photo("b", 1, 2), photo("c", 1, 2), photo("d", 1, 2)]);
  assert.deepEqual([share.portrait, share.landscape], [0.75, 0.25]);
  assert.deepEqual(orientationShare([]), { portrait: 0, landscape: 0, square: 0 });
});

test("detector de foto nova: a primeira leitura é a base; depois só o que não tinha aparecido, uma vez só", () => {
  const detector = createNewItemsDetector({ keyOf });
  assert.deepEqual(detector.observe([photo("a", 1, 1), photo("b", 1, 1)]), [], "fotos que já estavam no álbum não são novas");
  assert.deepEqual(detector.observe([photo("a", 1, 1), photo("b", 1, 1)]), []);
  assert.deepEqual(detector.observe([photo("c", 1, 1), photo("a", 1, 1), photo("b", 1, 1)]).map(keyOf), ["c"]);
  assert.deepEqual(detector.observe([photo("d", 1, 1), photo("c", 1, 1), photo("a", 1, 1)]).map(keyOf), ["d"], "c não volta a ser nova");
  detector.reset();
  assert.deepEqual(detector.observe([photo("x", 1, 1)]), [], "depois do reset recomeça da base");
});

const models = { mosaic: { count: 12 }, collage: { count: 6 }, "portrait-strip": { count: 4 }, feature: { count: 4 } };
const autoRules = { portraitMin: 0.6, landscapeMin: 0.6, portrait: "portrait-strip", landscape: "collage", mixed: "feature" };

test("modelo automático: álbum de retratos vira faixa de retratos, de paisagens vira colagem, misto vira destaque", () => {
  const many = (portraits, landscapes) => [...Array(portraits).fill(0).map((_, i) => photo(`p${i}`, 1, 2)), ...Array(landscapes).fill(0).map((_, i) => photo(`l${i}`, 2, 1))];
  assert.equal(chooseAlbumModel({ photos: many(166, 12), models, autoRules }).id, "portrait-strip", "o Elotech Agibank é 93% retrato");
  assert.equal(chooseAlbumModel({ photos: many(58, 242), models, autoRules }).id, "collage", "o DevFest 2025 é 81% paisagem");
  assert.equal(chooseAlbumModel({ photos: many(5, 5), models, autoRules }).id, "feature");
  assert.equal(chooseAlbumModel({ model: "auto", photos: [], models, autoRules }).id, "feature", "álbum vazio não quebra");
});

test("modelo escolhido por nome vale como está; nome que não existe é erro (a cena falha e descansa)", () => {
  assert.deepEqual(chooseAlbumModel({ model: "mosaic", photos: [], models, autoRules }), { id: "mosaic", count: 12 });
  assert.throws(() => chooseAlbumModel({ model: "inventado", photos: [], models, autoRules }), /modelo de álbum desconhecido/);
});
