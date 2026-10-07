/**
 * Testes de TELA dos desenhadores de cena do mural (docs/js/components/mural-scenes/*.js): cada um recebe suas dependências por parâmetro,
 * então aqui entram fotos, relógio e dados de mentira. Confere o que a pessoa vê e o que cada cena faz quando não tem nada pra mostrar ou algo falha.
 *   node --test DevFestIA/tools/dom/mural-scenes.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const SCENES = ["mural-scene-kit", "mural-now-next-scene", "mural-photos-scene", "mural-sponsors-scene", "mural-qr-scene", "mural-registered-scene", "mural-tips-scene", "mural-phoenix-scene", "mural-podium-scene", "mural-event-phase-scene", "mural-reserve-scene"].map(name => `components/mural-scenes/${name}.js`);
const site = loadSite({
  scripts: [...SITE_BASE, "features/scheduler.js", "features/agenda.js", "features/mural-now-next.js", "features/mural-photo-pool.js", "features/mural.js", "features/mural-playlist.js", "components/talk-highlight.js", "data/mural-tips.js", ...SCENES, "features/live-status.js"],
});
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const MURAL_SKIP = g("MURAL_SKIP");
const html = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };
const ctx = (extra = {}) => ({ now: new Date("2026-11-28T12:00:00Z"), reveal: true, phase: "live", live: {}, ...extra });
const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);

test("fotos: uma foto de cada vez em rodízio; foto que não carrega é trocada pela próxima na mesma preparação", async () => {
  let time = 0;
  const pool = g("createPhotoPool")({ photos: [{ file: "a.jpg", alt: "A" }, { file: "b.jpg", alt: "B" }, { file: "c.jpg", alt: "C" }], nowMs: () => time, quarantineMs: 1000 });
  const scene = g("createPhotosScene")({ pool, preload: async url => { if (url === "a.jpg") throw new Error("404"); }, caption: "Veja como foi 2025" });
  const photo = await scene.prepare();
  assert.equal(photo.file, "b.jpg", "pulou a quebrada");
  const view = html(scene.render(photo).markup);
  assert.equal(view.querySelector("img").getAttribute("src"), "b.jpg");
  assert.match(textOf(view), /Veja como foi 2025/);
  assert.equal(pool.usable(), 2, "a foto quebrada ficou de castigo");
});

test("fotos: se nenhuma carregar, a cena falha (e descansa) em vez de mostrar imagem quebrada", async () => {
  const pool = g("createPhotoPool")({ photos: [{ file: "a.jpg" }, { file: "b.jpg" }], nowMs: () => 0, quarantineMs: 1000 });
  const scene = g("createPhotosScene")({ pool, preload: async () => { throw new Error("sem rede"); }, caption: "x" });
  await assert.rejects(scene.prepare(), /nenhuma foto carregou/);
});

test("patrocinadores: só as cotas pedidas, logo que não carrega vira nome, cota vazia não gera cena", async () => {
  const repository = { getAll: () => [
    { tier: "Master", elements: [{ name: "Tecnova", imageUrl: "data:image/svg+xml;base64,AA" }] },
    { tier: "Apoio", elements: [{ name: "Café do Dev", imageUrl: "https://x/cafe.png" }, { name: "Gráfica", imageUrl: "https://x/ok.png" }] },
    { tier: "Intern", elements: [] },
  ] };
  const scene = g("createSponsorsScene")({ repository, preload: async url => { if (url.includes("cafe")) throw new Error("404"); } });
  const prepared = await scene.prepare({ tiers: ["Master", "Apoio", "Intern"] });
  assert.deepEqual([...prepared.map(tier => tier.tier)], ["Master", "Apoio"], "cota sem ninguém não entra");
  const view = html(scene.render(prepared, { title: "Quem faz" }).markup);
  assert.match(textOf(view), /Quem faz/);
  assert.equal(view.querySelectorAll("img").length, 2, "Tecnova (inline) e Gráfica; o Café ficou sem logo");
  assert.match(textOf(view), /Café do Dev/);
  assert.equal(await scene.prepare({ tiers: ["Intern"] }), MURAL_SKIP);
});

test("QR: monta o endereço do site com o ensaio, desenha com o renderizador injetado e some se a biblioteca faltar", () => {
  const drawn = [];
  const qr = { available: () => true, draw: (el, text) => drawn.push(text) };
  const scene = g("createQrScene")({ siteUrl: "https://site/", extraQuery: () => "&ensaio=09:00", qr });
  const view = scene.render(null, { kicker: "K", heading: "Avalie", hint: "Escaneie", path: "index.html?avaliar=1" });
  const el = html(view.markup);
  assert.match(textOf(el), /Avalie/);
  assert.match(textOf(el), /site\/index\.html\?avaliar=1/);
  view.mount(el);
  assert.deepEqual(drawn, ["https://site/index.html?avaliar=1&ensaio=09:00"]);
  assert.throws(() => g("createQrScene")({ siteUrl: "x", qr: { available: () => false } }).prepare(), /QR indisponível/);
});

test("inscritos: só com o total lido e acima do mínimo", () => {
  const scene = g("createRegisteredScene")();
  assert.equal(scene.prepare({ min: 30 }, ctx()), MURAL_SKIP);
  assert.equal(scene.prepare({ min: 30 }, ctx({ live: { registered: { total: 12 } } })), MURAL_SKIP);
  assert.equal(scene.prepare({ min: 30 }, ctx({ live: { registered: null } })), MURAL_SKIP);
  const total = scene.prepare({ min: 30 }, ctx({ live: { registered: { total: 1234 } } }));
  assert.match(textOf(html(scene.render(total).markup)), /1\.234/);
});

test("dicas: só as ligadas e dentro da janela de datas, no máximo `max`; nenhuma ativa = a cena não aparece", () => {
  const items = [{ id: "a", icon: "check", title: "A", text: "ta" }, { id: "b", icon: "star", title: "B", text: "tb", enabled: false }, { id: "c", icon: "chat", title: "C", text: "tc", until: "2026-11-28T10:00:00Z" }, { id: "d", icon: "gift", title: "D", text: "td", from: "2026-11-28T11:00:00Z" }];
  const repository = g("createRepository")(items, { getActive: now => items.filter(tip => tip.enabled !== false && (!tip.from || now >= new Date(tip.from)) && (!tip.until || now < new Date(tip.until))) });
  const scene = g("createTipsScene")({ repository });
  const shown = scene.prepare({ max: 4 }, ctx());
  assert.deepEqual(shown.map(tip => tip.id), ["a", "d"]);
  assert.equal(scene.prepare({ max: 1 }, ctx()).length, 1);
  assert.equal(g("createTipsScene")({ repository: { getActive: () => [] } }).prepare({}, ctx()), MURAL_SKIP);
  assert.match(textOf(html(scene.render(shown, { title: "Aproveite" }).markup)), /Aproveite.*A.*D/);
});

test("dicas reais do mural: os itens que dependem da organização (Wi-Fi, estacionamento, comida) começam desligados", () => {
  const active = g("muralTipsRepository").getActive(new Date("2026-11-28T12:00:00Z"));
  assert.ok(active.length >= 4);
  assert.ok(!active.some(tip => ["wifi", "estacionamento", "comida"].includes(tip.id)));
});

test("fênix: pré-carrega a imagem; se falhar a cena falha em vez de mostrar imagem quebrada", async () => {
  const ok = g("createPhoenixScene")({ preload: async () => {}, imageUrl: "f.png", title: "DevFest Campinas 2026", subtitle: "28 de novembro" });
  await ok.prepare();
  const view = html(ok.render().markup);
  assert.equal(view.querySelector("img").getAttribute("src"), "f.png");
  assert.match(textOf(view), /DevFest Campinas 2026.*28 de novembro/);
  await assert.rejects(g("createPhoenixScene")({ preload: async () => { throw new Error("404"); }, imageUrl: "f.png", title: "", subtitle: "" }).prepare());
});

test("pódio: sem pódio publicado a cena não aparece; com ele mostra projeto e pessoa nos lugares do destaque", () => {
  const entry = { key: "k1", data: { title: "GDG Campinas Coding Jam", highlight: "codejam" } };
  const scene = g("createPodiumScene")({ talkIndex: { get: key => (key === "k1" ? entry : undefined) }, highlightOf: g("talkHighlightsRepository").forTalk });
  assert.equal(scene.prepare({}, ctx()), MURAL_SKIP);
  assert.equal(scene.prepare({}, ctx({ live: { podium: { key: "outra", items: [{ place: 1 }] } } })), MURAL_SKIP, "sessão que não existe mais");
  const prepared = scene.prepare({}, ctx({ live: { podium: { key: "k1", items: [{ place: 1, project: "Foguete", name: "Ana" }] } } }));
  const view = html(scene.render(prepared).markup);
  assert.match(textOf(view), /Coding Jam.*O pódio chegou.*Foguete.*Ana/);
  assert.equal(view.querySelectorAll(".talk-podium-slot").length, 3, "os três lugares do destaque, o 2º e o 3º ainda vazios");
});

test("fase do evento: contagem regressiva anda sozinha e o agradecimento é fixo", async () => {
  const schedule = [{ start: new Date("2026-11-28T11:00:00Z"), end: new Date("2026-11-28T21:00:00Z") }];
  const scene = g("createEventPhaseScene")({ schedule, title: "DevFest Campinas 2026" });
  let clockNow = new Date("2026-11-28T10:00:00Z");
  const view = scene.render(null, { kind: "countdown" }, ctx({ now: clockNow }));
  const el = html(view.markup);
  assert.match(textOf(el), /01:00:00/);
  const clock = createFakeClock();
  const dispose = view.mount(el, { schedule: clock.schedule, clock: () => clockNow });
  clockNow = new Date("2026-11-28T10:59:30Z");
  await clock.tick(1000);
  assert.match(textOf(el), /00:00:30/);
  dispose();
  assert.equal(clock.pending(), 0, "o relógio parou junto com a cena");
  assert.match(textOf(html(scene.render(null, { kind: "thanks" }, ctx()).markup)), /Obrigado.*Até a próxima edição/);
});

test("reserva: logo, nome, relógio que anda sem rede; mostra o que está no ar só com o line-up revelado e avisa quando está sem internet", async () => {
  const tracks = [{ id: "ia", label: "IA", color: "blue" }];
  const schedule = [{ start: at("09:00"), end: at("09:40"), talks: { ia: { title: "Agentes", speakers: [] } } }];
  const phaseOf = g("resolveEventState");
  const scene = g("createReserveScene")({ logoSrc: "logo.svg", title: "DevFest Campinas 2026", subtitle: "28 de novembro", schedule, tracks, timezone: "America/Sao_Paulo", phaseOf });
  const live = scene.render(null, {}, ctx({ now: at("09:10") }));
  const el = html(live.markup);
  assert.match(textOf(el), /DevFest Campinas 2026/);
  assert.match(textOf(el), /Agentes/);
  assert.ok(!/Sem internet/.test(textOf(el)));
  const hidden = textOf(html(scene.render(null, {}, ctx({ now: at("09:10"), reveal: false })).markup));
  assert.ok(!/Agentes/.test(hidden), "mock não aparece sem o line-up revelado");
  assert.match(textOf(html(scene.render(null, {}, ctx({ network: { online: false } })).markup)), /Sem internet no momento/);
  const clock = createFakeClock();
  let now = at("09:10");
  const dispose = live.mount(el, { schedule: clock.schedule, clock: () => now });
  assert.match(el.querySelector("[data-clock]").textContent, /09:10/);
  now = at("09:11");
  await clock.tick(1000);
  assert.match(el.querySelector("[data-clock]").textContent, /09:11/);
  dispose();
});

test("agora e próximas: antes do evento mostra a hora da abertura e só 'a seguir'; no almoço mostra o aviso do bloco", () => {
  const tracks = [{ id: "ia", label: "IA", shortLabel: "IA", color: "blue", room: "Sala A" }];
  const schedule = [
    { banner: "Credenciamento", start: at("08:00"), end: at("09:00") },
    { talks: { ia: { title: "Agentes", speakers: [{ name: "Ana" }] } }, start: at("09:00"), end: at("09:40") },
    { banner: "Almoço", start: at("12:00"), end: at("13:00") },
  ];
  const scene = g("createNowNextScene")({ schedule, tracks, timezone: "America/Sao_Paulo", phaseOf: g("resolveEventState") });
  const before = textOf(html(scene.render(null, {}, ctx({ now: at("07:00") })).markup));
  assert.match(before, /Em breve.*começa às 08h/);
  assert.ok(!before.includes("Agora"), "antes do evento não há 'agora'");
  assert.match(before, /A seguir/);
  const lunch = textOf(html(scene.render(null, {}, ctx({ now: at("12:10") })).markup));
  assert.match(lunch, /Almoço/);
  assert.match(lunch, /até 13:00/);
  const live = textOf(html(scene.render(null, {}, ctx({ now: at("09:10") })).markup));
  assert.match(live, /Agentes.*Ana.*09:00 às 09:40/);
});
