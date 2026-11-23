/**
 * Testes de TELA do moderador de fotos do mural (docs/js/features/mural-photo-moderation.js): login, grade das fotos mais novas, tirar do ar e voltar ao ar, a lista que o banco devolve,
 * erro de permissão e de rede. Login, álbum e banco são de mentira (nada toca o Firebase nem o Google).
 *   node --test DevFestIA/tools/dom/mural-photo-moderation.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const site = loadSite({ scripts: [...SITE_BASE, "features/scheduler.js", "data/mural-albums.js", "data/albums-repository.js", "features/album-photo-url.js", "data/moderator-access-texts.js", "components/moderator-access.js", "features/moderator-access.js", "components/moderator-login.js", "components/mural-photo-moderation.js", "features/moderator-login.js", "features/mural-photo-moderation.js"] });
const { window, document } = site;
test.after(() => window.close());
const initMuralPhotoModeration = site.get("initMuralPhotoModeration");
const mountMuralPhotoModeration = site.get("mountMuralPhotoModeration");

const photo = (id, addedAt) => ({ id, url: `https://lh3.googleusercontent.com/pw/${id}`, width: 4000, height: 3000, addedAt });
const album = { id: "ao-vivo", label: "DevFest 2026 ao vivo" };

function setup({ approval = false, approvedInitial = null, photos = [photo("c", 3), photo("b", 2), photo("a", 1)], hiddenInitial = null, email = "mod@gmail.com", limit = 60, setImpl, access } = {}) {
  document.body.innerHTML = `<main id="modBody"></main>`;
  const clock = createFakeClock();
  const writes = [];
  const listeners = [];
  const calls = { album: 0, signOut: 0 };
  let albumPhotos = photos;
  let albumFails = false;
  const approvedWrites = [];
  const approvedListeners = [];
  const approvedRepository = {
    listen: (id, onNext, onError) => { approvedListeners.push({ id, onNext, onError }); onNext(approvedInitial); return () => approvedListeners.pop(); },
    set: async (id, data) => { approvedWrites.push({ id, data }); },
  };
  const hiddenRepository = {
    listen: (id, onNext, onError) => { listeners.push({ id, onNext, onError }); onNext(hiddenInitial); return () => listeners.pop(); },
    set: setImpl ?? (async (id, data) => { writes.push({ id, data }); }),
  };
  const login = { signIn: async () => email, restore: async () => (email === "restore" ? "mod@gmail.com" : null), signOut: async () => { calls.signOut++; } };
  const rootEl = document.getElementById("modBody");
  initMuralPhotoModeration(rootEl, {
    album: approval ? { ...album, approval: true } : album, hiddenRepository, approvedRepository, login, ...(access ? { access, accessText: site.get("moderatorAccessTextsRepository").getAll() } : {}), schedule: clock.schedule, refreshMs: 30000, limit, formatTime: item => `h${item.addedAt}`,
    albumsRepository: { get: async () => { calls.album++; if (albumFails) throw new Error("sem rede"); return { photos: albumPhotos }; } },
    whenReady: task => task(),
  });
  return { rootEl, clock, writes, approvedWrites, approvedListeners, listeners, calls, setPhotos: list => { albumPhotos = list; }, failAlbum: value => { albumFails = value; }, signIn: async () => { rootEl.querySelector("[data-mod-signin]").click(); await waitFor(() => rootEl.querySelector(".mf-grid")); } };
}
const tiles = root => [...root.querySelectorAll(".mf-tile")];

test("sem login: só o convite pra entrar com Google, sem ler álbum nem banco", () => {
  const { rootEl, calls, listeners } = setup();
  assert.ok(rootEl.querySelector("[data-mod-signin]"));
  assert.equal(rootEl.querySelector(".mf-grid"), null);
  assert.equal(calls.album, 0);
  assert.equal(listeners.length, 0);
});

test("entrar: mostra a conta, o nome do álbum e as fotos mais novas primeiro, com o horário e o tamanho de miniatura", async () => {
  const { rootEl, signIn } = setup();
  await signIn();
  assert.match(textOf(rootEl), /mod@gmail\.com/);
  assert.match(textOf(rootEl), /Fotos do telão: DevFest 2026 ao vivo/);
  assert.match(textOf(rootEl), /As 3 fotos mais novas\. Nenhuma fora do ar/);
  assert.deepEqual(tiles(rootEl).map(tile => tile.querySelector("img").getAttribute("src")), ["https://lh3.googleusercontent.com/pw/c=w400-h400", "https://lh3.googleusercontent.com/pw/b=w400-h400", "https://lh3.googleusercontent.com/pw/a=w400-h400"]);
  assert.deepEqual(tiles(rootEl).map(tile => textOf(tile.querySelector(".mf-time"))), ["h3", "h2", "h1"]);
  assert.ok(tiles(rootEl).every(tile => /Tirar do ar/.test(textOf(tile.querySelector("button")))));
});

test("login que já estava feito (tablet que recarregou) retoma sozinho", async () => {
  const { rootEl } = setup({ email: "restore" });
  await waitFor(() => rootEl.querySelector(".mf-grid"));
  assert.match(textOf(rootEl), /mod@gmail\.com/);
});

test("tirar do ar grava a lista de ids no banco do álbum; voltar ao ar regrava sem o id", async () => {
  const { rootEl, writes, signIn } = setup();
  await signIn();
  tiles(rootEl)[1].querySelector("button").click(); // a foto "b"
  await waitFor(() => writes.length === 1);
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0])), { id: "ao-vivo", data: { ids: ["b"] } });
  await waitFor(() => tiles(rootEl)[1].classList.contains("is-hidden"));
  assert.match(textOf(tiles(rootEl)[1].querySelector("button")), /Voltar ao ar/);
  assert.match(textOf(rootEl), /1 fora do ar/);
  tiles(rootEl)[0].querySelector("button").click(); // esconde também a "c"
  await waitFor(() => writes.length === 2);
  assert.deepEqual([...writes[1].data.ids].sort(), ["b", "c"]);
  tiles(rootEl)[1].querySelector("button").click(); // volta a "b"
  await waitFor(() => writes.length === 3);
  assert.deepEqual([...writes[2].data.ids], ["c"]);
});

test("a lista que o banco devolve (outra tela do moderador, recarga) marca as fotos fora do ar", async () => {
  const { rootEl, listeners, signIn } = setup({ hiddenInitial: { ids: ["a"] } });
  await signIn();
  assert.ok(tiles(rootEl)[2].classList.contains("is-hidden"));
  assert.match(textOf(rootEl), /1 fora do ar/);
  listeners[0].onNext({ ids: [] });
  await waitFor(() => !tiles(rootEl)[2].classList.contains("is-hidden"));
});

test("a lista de fotos se atualiza sozinha e foto nova aparece na frente; limite de fotos respeitado", async () => {
  const { rootEl, clock, setPhotos, calls, signIn } = setup({ limit: 3 });
  await signIn();
  setPhotos([photo("d", 4), photo("c", 3), photo("b", 2), photo("a", 1)]);
  await clock.tick(30000);
  await waitFor(() => tiles(rootEl)[0].querySelector("img").getAttribute("src").includes("/d="));
  assert.equal(tiles(rootEl).length, 3, "só as 3 mais novas");
  assert.ok(calls.album >= 2);
});

test("permissão negada (conta que não é moderadora): avisa e não marca como escondida", async () => {
  const { rootEl, signIn } = setup({ setImpl: async () => { throw Object.assign(new Error("negado"), { code: "permission-denied" }); } });
  await signIn();
  tiles(rootEl)[0].querySelector("button").click();
  await waitFor(() => /Sem permissão/.test(textOf(rootEl)));
  assert.ok(!tiles(rootEl)[0].classList.contains("is-hidden"));
  assert.ok(!tiles(rootEl)[0].querySelector("button").disabled, "o botão volta a funcionar");
});

test("erro de rede ao salvar ou ao ler o álbum: avisa e continua tentando", async () => {
  const failing = setup({ setImpl: async () => { throw new Error("sem rede"); } });
  await failing.signIn();
  failing.rootEl.querySelector("[data-photo-toggle]").click();
  await waitFor(() => /Não consegui salvar/.test(textOf(failing.rootEl)));

  const flaky = setup();
  await flaky.signIn();
  flaky.failAlbum(true);
  await flaky.clock.tick(30000);
  await waitFor(() => /Não consegui ler as fotos do álbum/.test(textOf(flaky.rootEl)));
  assert.equal(tiles(flaky.rootEl).length, 3, "continua mostrando as fotos que já tinha");
  flaky.failAlbum(false);
  await flaky.clock.tick(30000);
  await waitFor(() => !/Não consegui ler as fotos/.test(textOf(flaky.rootEl)));
});

test("sair para de ler o álbum e o banco e volta ao convite de login", async () => {
  const { rootEl, clock, calls, listeners, signIn } = setup();
  await signIn();
  rootEl.querySelector("[data-mod-signout]").click();
  await waitFor(() => rootEl.querySelector("[data-mod-signin]"));
  const reads = calls.album;
  await clock.tick(120000);
  assert.equal(calls.album, reads, "não relê o álbum depois de sair");
  assert.equal(calls.signOut, 1);
  assert.equal(listeners.length, 0, "parou de escutar o banco");
});

test("álbum vazio e login com erro mostram mensagens claras", async () => {
  const empty = setup({ photos: [] });
  await empty.signIn();
  assert.match(textOf(empty.rootEl), /Nenhuma foto no álbum ainda/);
  document.body.innerHTML = `<main id="modBody"></main>`;
  const rootEl = document.getElementById("modBody");
  initMuralPhotoModeration(rootEl, { album, hiddenRepository: { listen: () => () => {}, set: async () => {} }, albumsRepository: { get: async () => ({ photos: [] }) }, schedule: createFakeClock().schedule, whenReady: task => task(), login: { signIn: async () => { throw Object.assign(new Error("x"), { code: "auth/popup-blocked" }); }, restore: async () => null, signOut: async () => {} } });
  rootEl.querySelector("[data-mod-signin]").click();
  await waitFor(() => /bloqueou a janela do Google/.test(textOf(rootEl)));
});

test("id de foto vindo do Google nunca vira HTML", async () => {
  const { rootEl, signIn } = setup({ photos: [{ ...photo("x", 1), id: '"><img src=x onerror=alert(1)>' }] });
  await signIn();
  assert.equal(rootEl.querySelectorAll("img").length, 1, "só a miniatura, nenhuma imagem injetada");
  assert.equal(rootEl.querySelector("[data-photo-toggle]").dataset.photoToggle, '"><img src=x onerror=alert(1)>');
});

test("dentro da área de admin (embedded): sem porta de entrada, conta nem título; lê o álbum e o banco na hora e stop() desliga tudo", async () => {
  document.body.innerHTML = `<main id="modBody"></main>`;
  const rootEl = document.getElementById("modBody");
  const clock = createFakeClock();
  const listeners = [];
  let reads = 0;
  const view = initMuralPhotoModeration(rootEl, {
    album, embedded: true, schedule: clock.schedule, refreshMs: 30000, whenReady: task => task(),
    hiddenRepository: { listen: (id, onNext) => { listeners.push(id); onNext({ ids: ["b"] }); return () => listeners.pop(); }, set: async () => {} },
    albumsRepository: { get: async () => { reads++; return { photos: [photo("c", 3), photo("b", 2)] }; } },
  });
  await waitFor(() => rootEl.querySelectorAll(".mf-tile").length === 2);
  assert.equal(rootEl.querySelector("[data-mod-signin]"), null);
  assert.equal(rootEl.querySelector(".mod-title"), null);
  assert.equal(rootEl.querySelector(".mod-account"), null);
  assert.match(textOf(rootEl), /1 fora do ar/);
  view.stop();
  const readsAfterStop = reads;
  await clock.tick(120000);
  assert.equal(reads, readsAfterStop, "não relê o álbum depois do stop");
  assert.equal(listeners.length, 0, "parou de escutar o banco");
});

test("montagem pronta (usada pela página e pelo admin): álbum desconhecido lista os que existem; sem intermediário avisa; com os dois, lê o álbum pelo intermediário", async () => {
  document.body.innerHTML = `<main id="modBody"></main>`;
  const rootEl = document.getElementById("modBody");
  const hiddenRepository = { listen: (id, onNext) => { onNext(null); return () => {}; }, set: async () => {} };
  mountMuralPhotoModeration(rootEl, { album: null, proxyUrl: "https://proxy.test", albumIds: ["ao-vivo", "<b>x</b>"], hiddenRepository });
  assert.match(textOf(rootEl), /Álbum desconhecido\. Use \?album= com um destes: ao-vivo, <b>x<\/b>/);
  assert.equal(rootEl.querySelector("b"), null, "ids escapados");
  mountMuralPhotoModeration(rootEl, { album, proxyUrl: "", hiddenRepository });
  assert.match(textOf(rootEl), /intermediário de álbuns ainda não está ligado/);
  const asked = [];
  window.fetch = async url => { asked.push(url); return { ok: true, json: async () => ({ photos: [photo("a", 1)] }) }; };
  const view = mountMuralPhotoModeration(rootEl, { album, proxyUrl: "https://proxy.test", hiddenRepository, timeoutMs: 1000, embedded: true, formatTime: () => "" });
  await waitFor(() => rootEl.querySelectorAll(".mf-tile").length === 1);
  assert.deepEqual(asked, ["https://proxy.test/albums/ao-vivo"]);
  view.stop();
});

test("conta Google que não é moderadora: tela de bloqueio com a troca de conta, sem ler álbum nem banco", async () => {
  const { rootEl, calls, listeners } = setup({ access: { resolve: async () => ({ moderator: false }) } });
  rootEl.querySelector("[data-mod-signin]").click();
  await waitFor(() => rootEl.querySelector("[data-mod-signout]"));
  assert.match(textOf(rootEl), /não está liberada/i);
  assert.match(textOf(rootEl), /mod@gmail\.com/);
  assert.equal(rootEl.querySelector(".mf-grid"), null);
  assert.equal(calls.album, 0);
  assert.equal(listeners.length, 0);
});

test("não deu pra verificar a conta (rede): bloqueia com 'tentar de novo', que abre as fotos quando passa", async () => {
  let moderator = null;
  const { rootEl, listeners } = setup({ access: { resolve: async () => ({ moderator }) } });
  rootEl.querySelector("[data-mod-signin]").click();
  await waitFor(() => rootEl.querySelector("[data-mod-retry]"));
  assert.equal(listeners.length, 0);
  moderator = true;
  rootEl.querySelector("[data-mod-retry]").click();
  await waitFor(() => rootEl.querySelector(".mf-tile"));
  assert.equal(listeners.length, 1);
});

// ---------- álbum com aprovação (`approval: true`): Pendentes, No ar e Fora do ar ----------
/** Os arrays vêm do jsdom (outro realm): comparar como JSON. */
const plain = value => JSON.parse(JSON.stringify(value));
const tabLabels = root => [...root.querySelectorAll("[data-mod-tab]")].map(tab => textOf(tab));
const buttonsOf = tile => [...tile.querySelectorAll("button")].map(button => textOf(button));

test("álbum com aprovação: abre em Pendentes, com as fotos novas esperando, as contagens das três abas e o 'Aprovar todas'", async () => {
  const { rootEl, signIn, listeners, approvedWrites, writes } = setup({ approval: true, approvedInitial: { ids: ["a"] }, hiddenInitial: { ids: [] } });
  await signIn();
  assert.deepEqual(tabLabels(rootEl), ["Pendentes · 2", "No ar · 1", "Fora do ar · 0"]);
  assert.match(textOf(rootEl), /Nada vai ao telão sem você aprovar/);
  assert.deepEqual(tiles(rootEl).map(tile => textOf(tile.querySelector(".mf-time"))), ["h3", "h2"], "só as pendentes, a mais nova primeiro");
  assert.ok(tiles(rootEl).every(tile => JSON.stringify(buttonsOf(tile)) === JSON.stringify(["Aprovar", "Recusar"])));
  assert.ok(rootEl.querySelector("[data-approve-all]"));
  assert.equal(listeners.length, 1, "escuta a lista de escondidas");
  assert.deepEqual([approvedWrites.length, writes.length], [0, 0], "abrir a tela não grava nada");
});

test("Aprovar grava a lista de aprovadas (nada em escondidas) e a foto passa de Pendentes para No ar", async () => {
  const { rootEl, signIn, approvedWrites, writes } = setup({ approval: true, approvedInitial: { ids: [] }, hiddenInitial: { ids: [] } });
  await signIn();
  tiles(rootEl)[1].querySelector("[data-photo-approve]").click(); // a foto "b"
  await waitFor(() => approvedWrites.length === 1);
  assert.deepEqual(plain(approvedWrites[0]), { id: "ao-vivo", data: { ids: ["b"] } });
  assert.equal(writes.length, 0);
  assert.deepEqual(tabLabels(rootEl), ["Pendentes · 2", "No ar · 1", "Fora do ar · 0"]);
  rootEl.querySelector('[data-mod-tab="live"]').click();
  assert.match(textOf(rootEl), /As 1 fotos aprovadas/);
  assert.deepEqual(buttonsOf(tiles(rootEl)[0]), ["Tirar do ar"]);
});

test("Recusar esconde a foto (vai para Fora do ar, sem aprovar) e Voltar ao ar aprova de novo e tira da lista de escondidas", async () => {
  const { rootEl, signIn, approvedWrites, writes } = setup({ approval: true, approvedInitial: { ids: [] }, hiddenInitial: { ids: [] } });
  await signIn();
  tiles(rootEl)[0].querySelector("[data-photo-reject]").click(); // a foto "c"
  await waitFor(() => writes.length === 1);
  assert.deepEqual(plain(writes[0]), { id: "ao-vivo", data: { ids: ["c"] } });
  assert.equal(approvedWrites.length, 0);
  await waitFor(() => !rootEl.querySelector("button[disabled]")); // terminou de salvar
  assert.deepEqual(tabLabels(rootEl), ["Pendentes · 2", "No ar · 0", "Fora do ar · 1"]);
  rootEl.querySelector('[data-mod-tab="off"]').click();
  assert.match(textOf(rootEl), /Voltar ao ar aprova a foto de novo/);
  assert.deepEqual(buttonsOf(tiles(rootEl)[0]), ["Voltar ao ar"]);
  await waitFor(() => rootEl.querySelector("[data-photo-restore]:not([disabled])"));
  tiles(rootEl)[0].querySelector("[data-photo-restore]").click();
  await waitFor(() => approvedWrites.length === 1 && writes.length === 2);
  assert.deepEqual(plain(approvedWrites[0].data.ids), ["c"]);
  assert.deepEqual(plain(writes[1].data.ids), [], "saiu da lista de escondidas");
});

test("Tirar do ar (foto aprovada) esconde sem desaprovar; 'Aprovar todas as pendentes' aprova só as pendentes de uma vez", async () => {
  const { rootEl, signIn, approvedWrites, writes } = setup({ approval: true, approvedInitial: { ids: ["a"] }, hiddenInitial: { ids: [] } });
  await signIn();
  rootEl.querySelector('[data-mod-tab="live"]').click();
  tiles(rootEl)[0].querySelector("[data-photo-takedown]").click();
  await waitFor(() => writes.length === 1);
  assert.deepEqual(plain(writes[0].data.ids), ["a"]);
  assert.equal(approvedWrites.length, 0, "a lista de aprovadas não muda");
  rootEl.querySelector('[data-mod-tab="pending"]').click();
  rootEl.querySelector("[data-approve-all]").click();
  await waitFor(() => approvedWrites.length === 1);
  assert.deepEqual([...approvedWrites[0].data.ids].sort(), ["a", "b", "c"]);
  assert.equal(rootEl.querySelector("[data-approve-all]"), null, "sem pendentes não há botão");
  assert.match(textOf(rootEl), /Nenhuma foto esperando/);
});

test("aprovação: a lista de aprovadas que chega do banco atualiza a tela; sem permissão avisa e desfaz; até ler a lista nada de aprovar", async () => {
  const { rootEl, signIn, approvedListeners } = setup({ approval: true, approvedInitial: { ids: [] }, hiddenInitial: { ids: [] }, setImpl: async () => { throw Object.assign(new Error("negado"), { code: "permission-denied" }); } });
  await signIn();
  approvedListeners[0].onNext({ ids: ["a", "b", "c"] });
  assert.deepEqual(tabLabels(rootEl), ["Pendentes · 0", "No ar · 3", "Fora do ar · 0"]);
  approvedListeners[0].onNext({ ids: [] });
  tiles(rootEl)[0].querySelector("[data-photo-reject]").click();
  await waitFor(() => /Sem permissão/.test(textOf(rootEl)));
  assert.deepEqual(tabLabels(rootEl)[0], "Pendentes · 3", "a foto voltou para Pendentes");
});
