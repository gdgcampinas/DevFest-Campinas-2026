/**
 * Testes de TELA dos desenhadores de cena do mural (docs/js/components/mural-scenes/*.js): cada um recebe suas dependências por parâmetro,
 * então aqui entram fotos, relógio e dados de mentira. Confere o que a pessoa vê e o que cada cena faz quando não tem nada pra mostrar ou algo falha.
 *   node --test DevFestIA/tools/dom/mural-scenes.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");
const { createFakeClock } = require("../lib/fake-clock.js");

const SCENES = ["mural-scene-kit", "mural-now-next-scene", "mural-sponsors-scene", "mural-qr-scene", "mural-registered-scene", "mural-tips-scene", "mural-phoenix-scene", "mural-podium-scene", "mural-event-phase-scene", "mural-reserve-scene", "mural-spotlight-scene", "mural-selfie-scene", "mural-art-scene", "mural-album-scene", "mural-notice-scene", "mural-video-scene", "mural-team-scene", "mural-message-scene"].map(name => `components/mural-scenes/${name}.js`);
const site = loadSite({
  scripts: [...SITE_BASE, "features/scheduler.js", "features/agenda.js", "features/mural-now-next.js", "features/mural-photo-pool.js", "features/mural.js", "features/mural-playlist.js", "components/talk-highlight.js", "data/mural-tips.js", "data/mural-arts.js", "data/mural-albums.js", "data/mural-album-models.js", "features/album-photo-url.js", "features/album-models.js", "features/video-sound.js", "components/mural-scenes/album-models/album-model-collage.js", "components/mural-scenes/album-models/album-model-portrait-strip.js", "components/mural-scenes/album-models/album-model-polaroid.js", "components/mural-scenes/album-models/album-model-feature.js", "components/mural-scenes/album-models/album-model-mosaic.js", ...SCENES, "features/live-status.js", "features/count-up.js", "features/mural-rotation.js", "features/mural-messages.js", "data/mural-messages.js", "components/avatar.js"],
});
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const MURAL_SKIP = g("MURAL_SKIP");
const html = markup => { const el = document.createElement("div"); el.innerHTML = markup; return el; };
const ctx = (extra = {}) => ({ now: new Date("2026-11-28T12:00:00Z"), reveal: true, phase: "live", live: {}, ...extra });
const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);

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

test("QR: desenha o destino resolvido pelo injetado, mostra o texto só quando existe, não aparece sem destino e some se a biblioteca faltar", () => {
  const drawn = [];
  const qr = { available: () => true, draw: (el, text) => drawn.push(text) };
  const targets = { resolve: params => (params.path ? { url: `https://site/${params.path}&ensaio=09:00`, label: `site/${params.path}` } : params.album ? { url: "https://proxy/join/x", label: "" } : null) };
  const scene = g("createQrScene")({ targets, qr });
  const params = { kicker: "K", heading: "Avalie", hint: "Escaneie", path: "index.html?avaliar=1" };
  const view = scene.render(scene.prepare(params), params);
  const el = html(view.markup);
  assert.match(textOf(el), /Avalie/);
  assert.match(textOf(el), /site\/index\.html\?avaliar=1/);
  view.mount(el);
  assert.deepEqual(drawn, ["https://site/index.html?avaliar=1&ensaio=09:00"]);
  const albumParams = { heading: "Mande sua foto", hint: "Escaneie", album: "ao-vivo" };
  const albumView = scene.render(scene.prepare(albumParams), albumParams);
  assert.equal(html(albumView.markup).querySelector(".ms-url"), null, "endereço de intermediário não é pra ler");
  assert.equal(scene.prepare({ album: undefined, hint: "x" }), MURAL_SKIP, "sem destino a cena não aparece");
  assert.throws(() => g("createQrScene")({ targets, qr: { available: () => false } }).prepare({}), /QR indisponível/);
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

test("cartões entram em sequência: cada item leva a sua posição (--i), nas salas, nas dicas e nos patrocinadores", async () => {
  const positions = el => [...el.querySelectorAll(".ms-stagger")].map(item => item.getAttribute("style").match(/--i:(\d+)/)[1]);
  const tracks = [{ id: "ia", label: "IA", color: "blue", room: "A" }, { id: "web", label: "Web", color: "red", room: "B" }];
  const schedule = [{ talks: { ia: { title: "x", speakers: [] }, web: { title: "y", speakers: [] } }, start: at("09:00"), end: at("09:40") }];
  const nowNext = g("createNowNextScene")({ schedule, tracks, timezone: "America/Sao_Paulo", phaseOf: g("resolveEventState") });
  const cols = html(nowNext.render(null, {}, ctx({ now: at("09:10") })).markup);
  assert.deepEqual(positions(cols), ["0", "1"]);
  assert.match(cols.querySelector(".ms-col").getAttribute("style"), /--track-color:blue/, "a cor da trilha continua junto");

  const tipItems = [{ id: "a", icon: "check", title: "A", text: "a" }, { id: "b", icon: "star", title: "B", text: "b" }, { id: "c", icon: "chat", title: "C", text: "c" }];
  const tips = g("createTipsScene")({ repository: { getActive: () => tipItems } });
  assert.deepEqual(positions(html(tips.render(tipItems, {}).markup)), ["0", "1", "2"]);

  const sponsors = g("createSponsorsScene")({ repository: { getAll: () => [] }, preload: async () => {} });
  const tiers = [{ tier: "Apoio", elements: [{ name: "A", imageUrl: "" }, { name: "B", imageUrl: "" }] }];
  assert.deepEqual(positions(html(sponsors.render(tiers, { title: "t" }).markup)), ["0", "1"]);
});

test("patrocinadores: sem `tiers` mostra todas as cotas; layout e texto de cima vêm do dado (agradecimento)", async () => {
  const repository = { getAll: () => [
    { tier: "Master", elements: [{ name: "Tecnova", imageUrl: "" }] },
    { tier: "Apoio", elements: [{ name: "Café", imageUrl: "" }] },
    { tier: "Intern", elements: [] },
  ] };
  const scene = g("createSponsorsScene")({ repository, preload: async () => {} });
  const params = { kicker: "Muito obrigado", title: "A quem faz o DevFest acontecer", layout: "thanks" };
  const view = html(scene.render(await scene.prepare(params), params).markup);
  assert.deepEqual([...view.querySelectorAll(".ms-tier-name")].map(el => textOf(el)), ["Master", "Apoio"], "cota vazia não aparece");
  assert.ok(view.querySelector(".ms-sponsors-scene--thanks"));
  assert.match(textOf(view), /Muito obrigado.*A quem faz o DevFest acontecer/);
  const plain = html(scene.render(await scene.prepare({ tiers: ["Master"], title: "t" }), { tiers: ["Master"], title: "t" }).markup);
  assert.match(textOf(plain), /Patrocínio/, "o texto padrão continua");
  assert.equal(plain.querySelector(".ms-sponsors-scene--thanks"), null);
});

test("pódio: os lugares entram do último pro primeiro (--i do 3º é 0, do 1º é o maior)", () => {
  const entry = { key: "k1", data: { title: "Jam", highlight: "codejam" } };
  const scene = g("createPodiumScene")({ talkIndex: { get: () => entry }, highlightOf: g("talkHighlightsRepository").forTalk });
  const prepared = scene.prepare({}, ctx({ live: { podium: { key: "k1", items: [{ place: 1, project: "A", name: "a" }, { place: 2, project: "B", name: "b" }, { place: 3, project: "C", name: "c" }] } } }));
  const slots = [...html(scene.render(prepared).markup).querySelectorAll(".talk-podium-slot")];
  assert.deepEqual(slots.map(slot => slot.getAttribute("style")), ["--i:2", "--i:1", "--i:0"], "1º lugar por último, 3º primeiro");
});

test("pódio do site (card, modal, quadro da sala) continua sem estilo extra por lugar", () => {
  const markup = g("talkPodiumMarkup")([{ place: "1º", prize: "" }], []);
  assert.ok(!markup.includes("style="));
});

test("inscritos: o número sobe de 0 até o total e o total já está no HTML se a animação não rodar", async () => {
  const scene = g("createRegisteredScene")({ motion: { countUpMs: 400, countUpStepMs: 100 } });
  const view = scene.render(1234);
  const el = html(view.markup);
  assert.match(textOf(el), /1\.234/, "o total já está lá");
  const clock = createFakeClock();
  const dispose = view.mount(el, { schedule: clock.schedule });
  assert.equal(el.querySelector("[data-count-up]").textContent, "0");
  await clock.tick(1000);
  assert.equal(el.querySelector("[data-count-up]").textContent, "1.234");
  dispose();
  assert.equal(clock.pending(), 0);
});

const talkOf = (title, people = [], extra = {}) => ({ title, speakers: people, ...extra });
const spotTracks = [{ id: "ia", label: "IA", color: "blue", room: "Sala A" }, { id: "web", label: "Web", color: "red", room: "Sala B" }, { id: "mob", label: "Mobile", color: "green", room: "Sala C" }];
const spotSchedule = [{
  talks: {
    ia: talkOf("Agentes de IA", [{ name: "Ana Souza", title: "Engenheira de IA", photo: "ana.jpg" }], { description: "Descrição longa da palestra.", blurb: "Texto curto da Ana.", tags: ["agentes", "produção", "llm", "extra"] }),
    web: talkOf("Design systems", [{ name: "Camila Rocha", title: "Tech Lead", photo: "camila.jpg" }, { name: "Olivia Chen", title: "Front-end", photo: "olivia.jpg" }], { description: "Só a descrição." }),
  },
  start: at("09:00"), end: at("09:40"),
}];
const spotlight = (preloadPhoto = async () => {}, hostOf = () => null) => g("createSpotlightScene")({ schedule: spotSchedule, tracks: spotTracks, timezone: "America/Sao_Paulo", phaseOf: g("resolveEventState"), preloadPhoto, hostOf });

test("rolando agora: a posição escolhe a sala entre as que têm palestra no ar; sem sala nessa posição a cena não aparece", async () => {
  const scene = spotlight();
  const first = await scene.prepare({ slot: 0 }, ctx({ now: at("09:10") }));
  assert.equal(first.track.id, "ia");
  assert.equal((await scene.prepare({ slot: 1 }, ctx({ now: at("09:10") }))).track.id, "web");
  assert.equal(await scene.prepare({ slot: 2 }, ctx({ now: at("09:10") })), MURAL_SKIP, "só 2 salas com palestra: a 3ª posição não existe");
  assert.equal(await scene.prepare({ slot: 0 }, ctx({ now: at("12:00") })), MURAL_SKIP, "ninguém no ar fora do horário");
});

test("rolando agora: foto, nome, cargo, título, texto curto (blurb vence a descrição), tags limitadas, horário, progresso e pontinhos", async () => {
  const scene = spotlight();
  const prepared = await scene.prepare({ slot: 0 }, ctx({ now: at("09:10") }));
  const el = html(scene.render(prepared, {}, ctx({ now: at("09:10") })).markup);
  const text = textOf(el);
  assert.match(text, /Rolando agora/);
  assert.match(text, /Sala A · IA/);
  assert.match(text, /09:00 às 09:40/);
  assert.match(text, /Ana Souza.*Engenheira de IA/);
  assert.match(text, /Agentes de IA/);
  assert.match(text, /Texto curto da Ana/);
  assert.ok(!text.includes("Descrição longa"), "o blurb vence a descrição");
  assert.equal(el.querySelector("img.ms-avatar").getAttribute("src"), "ana.jpg");
  assert.equal(el.querySelectorAll(".ms-spot-tags li").length, 3, "no máximo 3 tags");
  assert.equal(el.querySelector("[data-progress]").style.width, "25%", "10 de 40 min");
  assert.match(el.querySelector("[data-left]").textContent, /faltam 30 min/);
  assert.equal(el.querySelectorAll(".ms-dots i").length, 2);
  assert.ok(el.querySelector(".ms-dots i").classList.contains("is-on"));
  assert.match(el.querySelector(".ms-spotlight").getAttribute("style"), /--track-color:blue/);
});

test("rolando agora: sem blurb usa a descrição; dois palestrantes aparecem juntos", async () => {
  const scene = spotlight();
  const prepared = await scene.prepare({ slot: 1 }, ctx({ now: at("09:10") }));
  const el = html(scene.render(prepared, {}, ctx({ now: at("09:10") })).markup);
  assert.match(textOf(el), /Só a descrição/);
  assert.equal(el.querySelectorAll(".ms-spot-person").length, 2);
  assert.equal(el.querySelector(".ms-spot-people").dataset.count, "2");
});

test("rolando agora: foto que falha ou demora vira iniciais, e a cena sai igual", async () => {
  const scene = spotlight(async url => { if (url === "ana.jpg") throw new Error("404"); });
  const prepared = await scene.prepare({ slot: 0 }, ctx({ now: at("09:10") }));
  const el = html(scene.render(prepared, {}, ctx({ now: at("09:10") })).markup);
  assert.equal(el.querySelector("img.ms-avatar"), null);
  assert.equal(textOf(el.querySelector(".ms-avatar--fallback")), "AS");
});

test("rolando agora: sessão sem palestrante (Coding Jam) usa quem conduz", async () => {
  const jamSchedule = [{ talks: { ia: talkOf("GDG Campinas Coding Jam", [], { highlight: "codejam" }) }, start: at("10:30"), end: at("11:10") }];
  const scene = g("createSpotlightScene")({ schedule: jamSchedule, tracks: [spotTracks[0]], timezone: "America/Sao_Paulo", phaseOf: g("resolveEventState"), preloadPhoto: async () => {}, hostOf: id => g("talkHighlightsRepository").getById(id).host });
  const prepared = await scene.prepare({ slot: 0 }, ctx({ now: at("10:40") }));
  assert.equal(prepared.people[0].name, "GDG Campinas");
  assert.match(textOf(html(scene.render(prepared, {}, ctx({ now: at("10:40") })).markup)), /Coding Jam/);
});

test("rolando agora: a barra e o 'faltam N min' andam com o relógio da cena", async () => {
  const scene = spotlight();
  const prepared = await scene.prepare({ slot: 0 }, ctx({ now: at("09:10") }));
  const view = scene.render(prepared, {}, ctx({ now: at("09:10") }));
  const el = html(view.markup);
  const clock = createFakeClock();
  let now = at("09:30");
  const dispose = view.mount(el, { schedule: clock.schedule, clock: () => now });
  assert.equal(el.querySelector("[data-progress]").style.width, "75%");
  assert.match(el.querySelector("[data-left]").textContent, /faltam 10 min/);
  now = new Date(at("09:40").getTime() - 30000);
  await clock.tick(1000);
  assert.match(el.querySelector("[data-left]").textContent, /faltam 1 min/);
  now = at("09:40");
  await clock.tick(1000);
  assert.match(el.querySelector("[data-left]").textContent, /últimos instantes/);
  dispose();
  assert.equal(clock.pending(), 0);
});

const styleVars = el => Object.fromEntries((el.querySelector(".ms-art-img").getAttribute("style") || "").split(";").filter(Boolean).map(pair => pair.split(/:(.*)/s).slice(0, 2)));

test("arte: pré-carrega e desenha em tela cheia; arte desconhecida ou imagem que não carrega falham (e descansam)", async () => {
  const preloaded = [];
  const repository = { get: id => ({ sunset: { file: "s.webp", alt: "Pôr do sol", fit: "cover", focus: { default: "50% 50%" } } })[id] ?? null };
  const scene = g("createArtScene")({ repository, preload: async url => preloaded.push(url) });
  const art = await scene.prepare({ art: "sunset" });
  assert.deepEqual(preloaded, ["s.webp"]);
  const el = html(scene.render(art).markup);
  assert.equal(el.querySelector("img.ms-art-img").getAttribute("src"), "s.webp");
  assert.equal(el.querySelector("img.ms-art-img").getAttribute("alt"), "Pôr do sol");
  await assert.rejects(scene.prepare({ art: "nao-existe" }), /arte desconhecida/);
  await assert.rejects(g("createArtScene")({ repository, preload: async () => { throw new Error("404"); } }).prepare({ art: "sunset" }));
});

test("arte: como ela se adapta a qualquer proporção sai do dado, por forma de tela (cover/contain e ponto de foco)", () => {
  const scene = g("createArtScene")({ repository: { get: () => null }, preload: async () => {} });
  const vars = styleVars(html(scene.render({ file: "g.webp", fit: { default: "contain", tall: "cover" }, focus: { default: "50% 40%", wide: "65% 50%" } }).markup));
  assert.equal(vars["--fit"], "contain");
  assert.equal(vars["--fit-tall"], "cover");
  assert.equal(vars["--focus"], "50% 40%");
  assert.equal(vars["--focus-wide"], "65% 50%");
  const plain = styleVars(html(scene.render({ file: "p.webp" }).markup));
  assert.deepEqual([plain["--fit"], plain["--focus"]], ["cover", "50% 50%"], "sem dado: preenche e centraliza");
});

test("as artes do dado: o banner preenche (cover) com foco por forma, as peças com texto aparecem inteiras (contain) e e o Gumbleton (tem o selo com texto) também aparece inteiro", () => {
  const arts = g("muralArtsRepository");
  assert.equal(arts.get("sunset").fit, "cover");
  assert.ok(arts.get("sunset").focus.tall && arts.get("sunset").focus.wide && arts.get("sunset").focus.standard && arts.get("sunset").focus.ultrawide);
  assert.equal(arts.get("invite").fit, "contain", "arte com texto não pode ser cortada");
  assert.equal(arts.get("gumbleton").fit, "contain", "o selo GUMBLETON é texto: em tela vertical o cover o cortava");
  assert.equal(arts.get("nao-existe"), null);
  Object.values(arts.getAll()).forEach(art => assert.match(art.file, /^assets\/img\/mural-art-[a-z]+\.webp\?v=\d+$/));
});

test("selfie com arte de fundo: a arte preenche e o nome e a data ficam numa faixa embaixo; sem logo nem fênix duplicados", async () => {
  const arts = { get: id => (id === "sunset" ? { file: "s.webp", fit: "cover" } : null) };
  const scene = g("createSelfieScene")({ preload: async () => {}, arts, mascotUrl: "f.png", logoSrc: "logo.svg", title: "DevFest Campinas 2026", subtitle: "28 de novembro de 2026" });
  const el = html(scene.render(null, { art: "sunset" }).markup);
  assert.ok(el.querySelector(".ms-selfie--art .ms-art-img"));
  assert.match(textOf(el.querySelector(".ms-selfie-bar")), /DevFest Campinas 2026.*28 de novembro de 2026/);
  assert.equal(el.querySelector(".ms-selfie-logo"), null);
  assert.equal(el.querySelector(".ms-selfie-mascot"), null);
});

test("selfie: cartão-postal com logo, nome e data grandes, hashtag só quando existir, e falha se a fênix não carregar", async () => {
  const scene = g("createSelfieScene")({ preload: async () => {}, arts: { get: () => null }, mascotUrl: "f.png", logoSrc: "logo.svg", title: "DevFest Campinas 2026", subtitle: "28 de novembro de 2026" });
  await scene.prepare({});
  const plain = html(scene.render(null, { hint: "Tire sua foto aqui" }).markup);
  assert.match(textOf(plain), /DevFest Campinas 2026.*28 de novembro de 2026.*Tire sua foto aqui/);
  assert.equal(plain.querySelector(".ms-selfie-tag"), null, "sem hashtag definida não aparece nada");
  assert.equal(html(scene.render(null, {}).markup).querySelector(".ms-selfie-hint"), null, "sem frase de apoio não sobra parágrafo vazio");
  assert.match(textOf(html(scene.render(null, { hashtag: "#DevFestCampinas" }).markup)), /#DevFestCampinas/);
  await assert.rejects(g("createSelfieScene")({ preload: async () => { throw new Error("404"); }, arts: { get: () => null }, mascotUrl: "f.png", logoSrc: "l", title: "", subtitle: "" }).prepare({}));
});

// ---------- álbuns do Google Fotos ----------
const albumPhoto = (id, width, height) => ({ id, url: `https://lh3.googleusercontent.com/pw/${id}`, width, height, addedAt: 1 });
const landscapes = count => Array.from({ length: count }, (_, i) => albumPhoto(`L${i}`, 4000, 3000));
const portraits = count => Array.from({ length: count }, (_, i) => albumPhoto(`P${i}`, 3000, 5333));

function albumScene({ preload = async () => {}, nowMs = () => 0 } = {}) {
  const models = g("muralAlbumModelsRepository");
  const renderers = {
    collage: g("albumCollageModel"), "portrait-strip": g("albumPortraitStripModel"), feature: g("albumFeatureModel"), mosaic: g("albumMosaicModel"),
    polaroid: g("createPolaroidAlbumModel")({ rotations: models.getAll().polaroid.rotations }),
  };
  const requested = [];
  const scene = g("createAlbumScene")({
    albums: g("muralAlbumsRepository"), models: models.getAll(), autoRules: models.auto(), renderers, orderPhotos: g("orderAlbumPhotos"),
    createPool: photos => g("createPhotoPool")({ photos, nowMs, quarantineMs: 1000, keyOf: photo => photo.id }),
    preload: async url => { requested.push(url); return preload(url); },
  });
  return { scene, requested };
}
const albumCtx = (albums, extra = {}) => ctx({ live: { albums, ...extra } });
const liveAlbum = photos => ({ id: "ao-vivo", title: "Ao vivo", photos });
const render = async (scene, params, context) => html(scene.render(await scene.prepare(params, context), params, context).markup);

test("álbum: sem lista (intermediário fora do ar e nada guardado) a cena não aparece; álbum desconhecido é falha; foto escondida pelo moderador não entra", async () => {
  const { scene } = albumScene();
  assert.equal(await scene.prepare({ album: "ao-vivo" }, ctx()), MURAL_SKIP);
  assert.equal(await scene.prepare({ album: "ao-vivo" }, albumCtx({})), MURAL_SKIP);
  await assert.rejects(scene.prepare({ album: "nao-existe" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(3)) })), /álbum desconhecido/);
  const prepared = await scene.prepare({ album: "ao-vivo", model: "collage", count: 4 }, albumCtx({ "ao-vivo": liveAlbum(landscapes(6)) }, { hidden: { "ao-vivo": ["L0", "L1"] } }));
  assert.deepEqual([...prepared.items.map(item => item.photo.id)].sort(), ["L2", "L3", "L4", "L5"]);
  assert.equal(await scene.prepare({ album: "ao-vivo" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(2)) }, { hidden: { "ao-vivo": ["L0", "L1"] } })), MURAL_SKIP, "tudo escondido");
});

test("álbum: cada modelo mostra a quantidade do dado, pede ao Google o tamanho do quadro e entra em fila", async () => {
  const album = { "ao-vivo": liveAlbum([...landscapes(10), ...portraits(10)]) };
  const { scene, requested } = albumScene();
  const collage = await render(scene, { album: "ao-vivo", model: "collage" }, albumCtx(album));
  assert.equal(collage.querySelectorAll(".ms-album-tile").length, 6);
  assert.ok(requested.every(url => url.endsWith("=w960-h640")), "a colagem pede quadros pequenos, não a foto de 4 MB");
  assert.deepEqual([...collage.querySelectorAll(".ms-stagger")].map(item => item.getAttribute("style").match(/--i:(\d+)/)[1]), ["0", "1", "2", "3", "4", "5"]);

  requested.length = 0;
  const mosaic = await render(scene, { album: "ao-vivo", model: "mosaic" }, albumCtx(album));
  assert.equal(mosaic.querySelectorAll(".ms-album--mosaic .ms-album-tile").length, 12);
  assert.ok(requested.every(url => url.endsWith("=w640-h640")), "o mosaico pede quadros pequenos");

  const strip = await render(scene, { album: "ao-vivo", model: "portrait-strip" }, albumCtx(album));
  assert.equal(strip.querySelectorAll(".ms-album--strip .ms-album-tile").length, 4);

  const feature = await render(scene, { album: "ao-vivo", model: "feature" }, albumCtx(album));
  assert.equal(feature.querySelectorAll(".ms-album--feature .ms-album-tile").length, 4);

  const polaroid = await render(scene, { album: "ao-vivo", model: "polaroid" }, albumCtx(album));
  const tiles = [...polaroid.querySelectorAll(".ms-album--polaroid .ms-album-tile")];
  assert.equal(tiles.length, 5);
  assert.equal(new Set(tiles.map(tile => tile.getAttribute("style").match(/--rot:(-?\d+)deg/)[1])).size, 5, "cada polaroide com um giro diferente");

  const fewer = await render(scene, { album: "ao-vivo", model: "collage" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(4)) }));
  assert.equal(fewer.querySelectorAll(".ms-album-tile").length, 4, "álbum com menos fotos que o modelo mostra as que tem, desde que passe do mínimo");
});

test("álbum: NUNCA uma foto sozinha nem grade capenga: abaixo do mínimo do modelo a cena não aparece até o álbum encher", async () => {
  const { scene, requested } = albumScene();
  for (const [model, min] of [["collage", 4], ["portrait-strip", 3], ["polaroid", 3], ["feature", 4], ["mosaic", 8]]) {
    assert.equal(await scene.prepare({ album: "ao-vivo", model }, albumCtx({ "ao-vivo": liveAlbum(landscapes(min - 1)) })), MURAL_SKIP, `${model} com ${min - 1} fotos`);
    assert.ok((await scene.prepare({ album: "ao-vivo", model }, albumCtx({ "ao-vivo": liveAlbum(landscapes(min)) }))).items.length >= min, `${model} com ${min} fotos`);
  }
  assert.equal(await scene.prepare({ album: "ao-vivo", model: "auto" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(1)) })), MURAL_SKIP, "uma foto só: nada aparece");
  requested.length = 0;
  await scene.prepare({ album: "ao-vivo", model: "mosaic" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(3)) }));
  assert.equal(requested.length, 0, "abaixo do mínimo nem baixa foto");
  const fails = albumScene({ preload: async url => { if (!url.includes("/L0=")) throw new Error("404"); } });
  assert.equal(await fails.scene.prepare({ album: "ao-vivo", model: "collage" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(5)) })), MURAL_SKIP, "só sobrou uma foto que carrega: não mostra sozinha");
});

test("álbum: o modelo automático olha as fotos: retratos viram faixa de retratos e escolhe retratos primeiro, paisagens viram colagem", async () => {
  const { scene } = albumScene();
  const strip = await render(scene, { album: "ao-vivo", model: "auto" }, albumCtx({ "ao-vivo": liveAlbum([...portraits(28), ...landscapes(2)]) }));
  assert.ok(strip.querySelector(".ms-album--strip"));
  const urls = [...strip.querySelectorAll("img")].map(img => img.getAttribute("src"));
  assert.ok(urls.every(url => url.includes("/P")), "mostra retratos primeiro");
  const collage = await render(scene, { album: "ao-vivo", model: "auto" }, albumCtx({ "ao-vivo": liveAlbum([...landscapes(24), ...portraits(6)]) }));
  assert.ok(collage.querySelector(".ms-album--collage"));
});

test("álbum: a rotação passa por todas as fotos antes de repetir, e foto nova no álbum ao vivo entra primeiro", async () => {
  const { scene } = albumScene();
  const first = landscapes(12);
  const seen = [];
  for (let pass = 0; pass < 2; pass++) (await scene.prepare({ album: "ao-vivo", model: "collage" }, albumCtx({ "ao-vivo": liveAlbum(first) }))).items.forEach(item => seen.push(item.photo.id));
  assert.equal(new Set(seen).size, 12, "6 + 6 fotos, nenhuma repetida");
  const fresh = [albumPhoto("NOVA", 4000, 3000), ...first];
  const prepared = await scene.prepare({ album: "ao-vivo", model: "collage" }, albumCtx({ "ao-vivo": liveAlbum(fresh) }));
  assert.equal(prepared.items[0].photo.id, "NOVA", "o álbum ao vivo recomeça pelas mais novas");
});

test("álbum: foto que não carrega é trocada por outra na mesma preparação; se nenhuma carregar, a cena falha", async () => {
  const bad = new Set();
  const { scene } = albumScene({ preload: async url => { if ([...bad].some(id => url.includes(`/${id}=`))) throw new Error("404"); } });
  bad.add("L0").add("L1");
  const prepared = await scene.prepare({ album: "ao-vivo", model: "collage" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(10)) }));
  assert.equal(prepared.items.length, 6, "completou com outras fotos");
  assert.ok(!prepared.items.some(item => bad.has(item.photo.id)));
  const allBad = albumScene({ preload: async () => { throw new Error("sem rede"); } });
  await assert.rejects(allBad.scene.prepare({ album: "ao-vivo", model: "collage" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(4)) })), /nenhuma foto do álbum carregou/);
});

test("álbum: a etiqueta mostra o nome, a bolinha 'ao vivo' só no álbum ao vivo e o selo quando pedido", async () => {
  const { scene } = albumScene();
  const album = { "ao-vivo": liveAlbum(landscapes(4)), "devfest-2025": { id: "devfest-2025", photos: landscapes(4) } };
  const live = await render(scene, { album: "ao-vivo", model: "feature", badge: "Nova foto da galera" }, albumCtx(album));
  assert.match(textOf(live.querySelector(".ms-album-caption")), /DevFest 2026 ao vivo.*Nova foto da galera/);
  assert.ok(live.querySelector(".ms-live-dot"));
  const old = await render(scene, { album: "devfest-2025", model: "collage" }, albumCtx(album));
  assert.match(textOf(old.querySelector(".ms-album-caption")), /DevFest Campinas 2025/);
  assert.equal(old.querySelector(".ms-live-dot"), null);
});

test("foto nova (latest): a que acabou de chegar em destaque grande com as mais recentes ao lado e o selo; só do álbum certo e se não estiver escondida", async () => {
  const { scene, requested } = albumScene();
  const album = { "ao-vivo": liveAlbum(landscapes(5)) };
  const newest = albumPhoto("RECEM", 4032, 3024);
  assert.equal(await scene.prepare({ album: "ao-vivo", latest: true }, albumCtx(album)), MURAL_SKIP, "sem foto nova nada aparece");
  const withNew = albumCtx(album, { newPhoto: { key: "ao-vivo", photo: newest, photos: [newest] } });
  const el = await render(scene, { album: "ao-vivo", latest: true, badge: "Nova foto da galera" }, withNew);
  const tiles = [...el.querySelectorAll(".ms-album--feature .ms-album-tile img")].map(img => img.getAttribute("src"));
  assert.equal(tiles.length, 4, "nunca sozinha: destaque + 3");
  assert.equal(tiles[0], "https://lh3.googleusercontent.com/pw/RECEM=w1400-h1000", "a nova é a grande");
  assert.ok(!tiles.slice(1).some(url => url.includes("RECEM")), "e não repete nas pequenas");
  assert.match(textOf(el), /Nova foto da galera/);
  assert.equal(requested.length, 4);
  assert.equal(await scene.prepare({ album: "elotech-agibank", latest: true }, albumCtx({ "elotech-agibank": liveAlbum(landscapes(2)) }, { newPhoto: { key: "ao-vivo", photo: newest, photos: [newest] } })), MURAL_SKIP, "foto nova de outro álbum");
  assert.equal(await scene.prepare({ album: "ao-vivo", latest: true }, albumCtx(album, { newPhoto: { key: "ao-vivo", photo: newest, photos: [newest] }, hidden: { "ao-vivo": ["RECEM"] } })), MURAL_SKIP, "o moderador tirou do ar");
});

test("álbum: ordem 'shuffle' embaralha uma vez e 'newest' mantém a lista como veio; o modelo desconhecido falha", async () => {
  const photos = landscapes(10).map(photo => photo);
  assert.deepEqual([...g("orderAlbumPhotos")(photos, "newest").map(p => p.id)], photos.map(p => p.id));
  assert.deepEqual([...g("orderAlbumPhotos")(photos, "oldest").map(p => p.id)], [...photos].reverse().map(p => p.id));
  const shuffled = g("orderAlbumPhotos")(photos, "shuffle", () => 0);
  assert.equal(new Set(shuffled.map(p => p.id)).size, 10);
  assert.notDeepEqual([...shuffled.map(p => p.id)], photos.map(p => p.id));
  const { scene } = albumScene();
  await assert.rejects(scene.prepare({ album: "ao-vivo", model: "inventado" }, albumCtx({ "ao-vivo": liveAlbum(landscapes(3)) })), /modelo de álbum desconhecido/);
});

// ---------- controle remoto: avisos e emergência ----------
const notice = (id, text, kind = "info", until = 10_000) => ({ id, text, kind, until });

test("aviso: o mais novo grande e os outros embaixo; alerta ganha destaque; aviso vencido não entra; sem aviso vivo a cena não aparece; o texto do moderador é escapado", async () => {
  const scene = g("createNoticeScene")({ nowMs: () => 5000 });
  assert.equal(scene.prepare({}, ctx()), MURAL_SKIP, "sem aviso nenhum");
  assert.equal(scene.prepare({}, ctx({ live: { notices: [notice("a", "venceu", "info", 4000)] } })), MURAL_SKIP, "só o vencido");
  const live = { notices: [notice("a", "Achado e perdido: chave azul"), notice("b", "Sala B começa em 5 min", "alert"), notice("c", "<img src=x onerror=alert(1)>")] };
  const el = html(scene.render(scene.prepare({}, ctx({ live }))).markup);
  assert.equal(el.querySelector(".ms-notice").dataset.kind, "info");
  assert.match(textOf(el.querySelector(".ms-notice-text")), /<img src=x/, "o texto aparece como texto, não vira HTML");
  assert.equal(el.querySelector(".ms-notice img"), null);
  assert.deepEqual([...el.querySelectorAll(".ms-notice-item")].map(item => textOf(item)), ["Sala B começa em 5 min", "Achado e perdido: chave azul"], "o mais novo é o grande, os outros em ordem do mais novo pro mais antigo");
  const alert = html(scene.render(scene.prepare({}, ctx({ live: { notices: [notice("x", "Atraso de 15 min", "alert")] } }))).markup);
  assert.equal(alert.querySelector(".ms-notice").dataset.kind, "alert");
  assert.match(textOf(alert), /Atenção.*Atraso de 15 min/);
  assert.equal(alert.querySelector(".ms-notice-list"), null, "um aviso só: sem lista vazia");
});

test("emergência: um texto em tela cheia (escapado), a cena não aparece sem emergência armada", () => {
  const scene = g("createEmergencyScene")();
  assert.equal(scene.prepare({}, ctx()), MURAL_SKIP);
  const el = html(scene.render(scene.prepare({}, ctx({ live: { emergency: { text: "Evacuação: sigam <b>as saídas</b>", since: 1 } } }))).markup);
  assert.equal(el.querySelector(".ms-emergency").getAttribute("role"), "alert");
  assert.match(textOf(el), /Atenção.*Evacuação: sigam <b>as saídas<\/b>/);
  assert.equal(el.querySelector("b"), null);
});

// ---------- vídeos ----------
const clip = (id, seconds = 10) => ({ id, file: `${id}.mp4`, label: `Clipe ${id} <b>`, seconds, fit: { default: "cover", tall: "contain" } });
function videoScene({ ready = new Set(["a.mp4", "b.mp4", "c.mp4"]), baseUrl = "https://media.test/", sound = { moments: ["lunch"], phases: ["after"] }, clips = [clip("a"), clip("b"), clip("c")] } = {}) {
  const requested = [];
  const cache = { request: url => { requested.push(url); return ready.has(url.split("/").pop()) ? `blob:${url.split("/").pop()}` : null; } };
  const videos = { playlist: name => (name === "lista" ? { sound, clips } : null) };
  return { scene: g("createVideoScene")({ videos, cache, baseUrl, slackSeconds: 0.5 }), requested, ready };
}

test("vídeo: sem endereço do intermediário, sem lista ou sem nenhum clipe baixado a cena não aparece; clipe que ainda não baixou é pulado e a vez passa pro próximo", () => {
  assert.equal(videoScene({ baseUrl: "" }).scene.prepare({ playlist: "lista" }, ctx()), MURAL_SKIP);
  assert.equal(videoScene().scene.prepare({ playlist: "nao-existe" }, ctx()), MURAL_SKIP);
  assert.equal(videoScene({ clips: [] }).scene.prepare({ playlist: "lista" }, ctx()), MURAL_SKIP);
  const none = videoScene({ ready: new Set() });
  assert.equal(none.scene.prepare({ playlist: "lista" }, ctx()), MURAL_SKIP);
  assert.deepEqual(none.requested, ["https://media.test/a.mp4", "https://media.test/b.mp4", "https://media.test/c.mp4"], "pediu todos (começa a baixar os que faltam)");
  const partial = videoScene({ ready: new Set(["b.mp4"]) });
  assert.equal(partial.scene.prepare({ playlist: "lista" }, ctx()).clip.id, "b", "a (não baixado) foi pulado");
});

test("vídeo: cada vez que a cena volta toca o PRÓXIMO clipe da lista e dá a volta; o tempo de tela é a duração do clipe mais a folga", () => {
  const { scene } = videoScene({ clips: [clip("a", 10), clip("b", 12.5), clip("c", 8)] });
  const played = [];
  for (let i = 0; i < 4; i++) {
    const prepared = scene.prepare({ playlist: "lista" }, ctx());
    played.push([prepared.clip.id, scene.render(prepared).seconds]);
  }
  assert.deepEqual(played, [["a", 10.5], ["b", 13], ["c", 8.5], ["a", 10.5]]);
});

test("vídeo: o som só toca nos momentos e fases do dado (almoço, depois do evento); fora deles o clipe toca mudo; etiqueta escapada e encaixe por forma no estilo", () => {
  const { scene } = videoScene();
  const markupAt = context => html(scene.render(scene.prepare({ playlist: "lista" }, ctx(context))).markup);
  assert.equal(markupAt({ moment: "lunch", phase: "live" }).querySelector("video").hasAttribute("muted"), false, "almoço: com som");
  assert.equal(markupAt({ moment: null, phase: "after" }).querySelector("video").hasAttribute("muted"), false, "depois do evento: com som");
  const talk = markupAt({ moment: null, phase: "live" });
  assert.equal(talk.querySelector("video").hasAttribute("muted"), true, "em palestra: mudo");
  assert.equal(talk.querySelector("b"), null, "etiqueta escapada");
  assert.match(textOf(talk), /Clipe c <b>/);
  assert.match(talk.querySelector("video").getAttribute("style"), /--fit:cover;--fit-tall:contain/);
  assert.equal(talk.querySelector("video").getAttribute("src"), "blob:c.mp4", "o terceiro pedido: o clipe c");
  assert.equal(g("createVideoScene")({ videos: { playlist: () => ({ clips: [clip("x")] }) }, cache: { request: () => "blob:x" }, baseUrl: "u/" }).prepare({ playlist: "p" }, ctx({ moment: "lunch" })).sound, false, "playlist sem regra de som: sempre mudo");
});

test("vídeo (montagem): toca na entrada; se o navegador bloqueia o som toca mudo em vez de parar; erro do vídeo avisa o motor; ao sair solta o vídeo", async () => {
  const { scene } = videoScene();
  const mountWith = async ({ playBehavior, context }) => {
    const view = scene.render(scene.prepare({ playlist: "lista" }, ctx(context)));
    const el = html(view.markup);
    const video = el.querySelector("video");
    const calls = [];
    video.play = () => { calls.push(["play", video.muted]); return playBehavior(calls.filter(call => call[0] === "play").length); };
    video.pause = () => calls.push(["pause"]);
    video.load = () => calls.push(["load"]);
    const errors = [];
    const dispose = view.mount(el, { reportError: error => errors.push(error.message) });
    await new Promise(resolve => setImmediate(resolve));
    return { video, calls, errors, dispose };
  };
  const ok = await mountWith({ playBehavior: async () => {}, context: { moment: "lunch" } });
  assert.deepEqual(ok.calls, [["play", false]]);
  ok.dispose();
  assert.deepEqual(ok.calls.slice(1), [["pause"], ["load"]]);
  assert.equal(ok.video.hasAttribute("src"), false, "soltou o vídeo");

  const blocked = await mountWith({ playBehavior: async attempt => { if (attempt === 1) throw Object.assign(new Error("bloqueado"), { name: "NotAllowedError" }); }, context: { moment: "lunch" } });
  assert.equal(blocked.video.muted, true, "som bloqueado: segue mudo");
  assert.equal(blocked.calls.filter(call => call[0] === "play").length, 2);
  assert.deepEqual(blocked.errors, []);

  const dead = await mountWith({ playBehavior: async () => { throw new Error("decodificador falhou"); }, context: { moment: null, phase: "live" } });
  assert.match(dead.errors[0], /vídeo .*: decodificador falhou/);

  const loadError = await mountWith({ playBehavior: async () => {}, context: { moment: null } });
  loadError.video.dispatchEvent(new window.Event("error"));
  assert.match(loadError.errors[0], /não carregou/);
});

// ---------- cena do time ----------
const person = (name, extra = {}) => ({ name, role: "", type: "voluntario", photo: "", bio: "", trackColor: "var(--accent)", social: [], ...extra });

test("time: uma pessoa por passada na ordem do dado e volta ao começo; organizador e voluntário aparecem com o grupo certo", async () => {
  const team = [person("Ana Souza", { type: "organizador", role: "Organizadora", trackColor: "var(--google-blue)", bio: "Ana cuida da programação." }), person("Bruno Lima", { role: "Voluntário" }), person("Carla Dias")];
  const scene = g("createTeamScene")({ repository: { getAll: () => team }, preload: async () => {}, rotation: g("createRotation")() });
  const names = [];
  for (let i = 0; i < 4; i++) {
    const prepared = await scene.prepare({ kicker: "Gente como você", title: "Quem faz" });
    const view = html(scene.render(prepared, { kicker: "Gente como você", title: "Quem faz" }).markup);
    names.push(textOf(view.querySelector(".ms-team-name")));
    if (i === 0) {
      assert.match(textOf(view), /Gente como você/);
      assert.match(textOf(view.querySelector(".ms-team-role")), /^Organização · Organizadora$/);
      assert.match(textOf(view), /Ana cuida da programação\./);
      assert.match(view.querySelector(".ms-team").getAttribute("style"), /var\(--google-blue\)/);
    }
  }
  assert.deepEqual(names, ["Ana Souza", "Bruno Lima", "Carla Dias", "Ana Souza"]);
});

test("time: sem foto cai nas iniciais, foto que falha também, sem bio mostra só o cargo, e a bio longa é cortada em palavra inteira", async () => {
  const long = "Palavra ".repeat(60).trim();
  const team = [person("Dora Ramos"), person("Edu Prado", { photo: "assets/x.webp", bio: long }), person("Fabi Nunes", { photo: "assets/ok.webp" })];
  const scene = g("createTeamScene")({ repository: { getAll: () => team }, preload: async url => { if (url.includes("x.webp")) throw new Error("404"); }, rotation: g("createRotation")() });
  const render = async () => html(scene.render(await scene.prepare({}), {}).markup);
  const first = await render();
  assert.ok(first.querySelector(".ms-avatar--fallback"), "sem foto: iniciais");
  assert.equal(textOf(first.querySelector(".ms-avatar--fallback")), "DR");
  assert.equal(first.querySelector(".ms-team-bio"), null, "sem bio não desenha o texto");
  const second = await render();
  assert.ok(second.querySelector(".ms-avatar--fallback"), "foto que não carrega: iniciais");
  const bio = textOf(second.querySelector(".ms-team-bio"));
  assert.ok(bio.endsWith("…") && bio.length <= 221 && !/Palav…$/.test(bio), `bio cortada em palavra inteira: ${bio.slice(-12)}`);
  const third = await render();
  assert.equal(third.querySelector("img.ms-avatar").getAttribute("src"), "assets/ok.webp");
});

test("time: sem ninguém no time a cena não aparece; nome com HTML nunca vira HTML; as duas entradas do dado dividem o rodízio", async () => {
  const empty = g("createTeamScene")({ repository: { getAll: () => [] }, preload: async () => {}, rotation: g("createRotation")() });
  assert.equal(await empty.prepare({}), MURAL_SKIP);
  const team = [person("<b>Xis</b>"), person("Yara")];
  const scene = g("createTeamScene")({ repository: { getAll: () => team }, preload: async () => {}, rotation: g("createRotation")() });
  const one = html(scene.render(await scene.prepare({ rotation: "time" }), {}).markup);
  assert.equal(one.querySelectorAll("b").length, 1, "só o <b> do grupo do próprio cartão, nenhum vindo do nome");
  assert.equal(textOf(one.querySelector(".ms-team-role b")), "Voluntariado");
  assert.equal(textOf(one.querySelector(".ms-team-name")), "<b>Xis</b>");
  const two = html(scene.render(await scene.prepare({ rotation: "time" }), {}).markup);
  assert.equal(textOf(two.querySelector(".ms-team-name")), "Yara", "a 2ª entrada com a mesma chave mostra a próxima pessoa");
});

test("muralShorten: texto que cabe volta igual (espaços limpos) e o que não cabe termina em reticências sem cortar palavra", () => {
  assert.equal(g("muralShorten")("  oi   tudo  bem ", 50), "oi tudo bem");
  assert.equal(g("muralShorten")("uma frase bem comprida demais", 12), "uma frase…");
  assert.equal(g("muralShorten")(null, 5), "");
});

// ---------- cena de mensagem ----------
function messageScene({ vars = {}, sets, preload = async () => {}, moment = null } = {}) {
  const repository = { getAll: () => sets ?? g("MURAL_MESSAGES"), vars: () => vars };
  const scene = g("createMessageScene")({ repository, rotation: g("createRotation")(), timezone: "America/Sao_Paulo", formatTime: (date, zone) => date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }), preload, mascotUrl: "assets/img/gumbleton.png" });
  const show = async (params, when = at("10:00"), extra = {}) => {
    const prepared = await scene.prepare(params, ctx({ now: when, moment, ...extra }));
    return prepared === MURAL_SKIP ? MURAL_SKIP : html(scene.render(prepared, params).markup);
  };
  return { show };
}

test("mensagem: o quebra-gelo mostra uma pergunta nova a cada passada e dá a volta na lista", async () => {
  const { show } = messageScene();
  const total = g("MURAL_MESSAGES").icebreaker.items.length;
  const seen = [];
  for (let i = 0; i < total + 1; i++) seen.push(textOf((await show({ set: "icebreaker" })).querySelector(".ms-message-text")));
  assert.equal(new Set(seen.slice(0, total)).size, total, "nenhuma repetida até dar a volta");
  assert.equal(seen[total], seen[0], "dá a volta");
  assert.match(seen[0], /O que você está construindo agora\?/);
});

test("mensagem: saudação pela hora do evento (fuso de Campinas) e 'Boa volta!' quando o bloco da grade é o retorno do almoço", async () => {
  const { show } = messageScene();
  const text = async (when, moment = null) => textOf((await show({ set: "greeting" }, when, { moment })).querySelector(".ms-message-text"));
  assert.equal(await text(at("08:10")), "Bom dia, Campinas!");
  assert.equal(await text(at("12:00")), "Boa tarde, Campinas!");
  assert.equal(await text(at("17:59")), "Boa tarde, Campinas!");
  assert.equal(await text(at("18:30")), "Boa noite, Campinas!");
  assert.equal(await text(at("02:00")), "Boa noite, Campinas!", "a janela da noite passa da meia-noite");
  assert.equal(await text(at("13:25"), "back-to-room"), "Boa volta!", "o bloco da grade vence a janela de horário");
});

test("mensagem: 'Primeira vez aqui?' usa a cor da camiseta quando ela está preenchida e o texto sem cor quando não está", async () => {
  const semCor = await messageScene({ vars: { shirt: "" } }).show({ set: "welcome" });
  assert.match(textOf(semCor.querySelector(".ms-message-hint")), /Procure alguém da equipe de voluntários/);
  const comCor = await messageScene({ vars: { shirt: "azul" } }).show({ set: "welcome" });
  assert.match(textOf(comCor.querySelector(".ms-message-hint")), /Procure a camiseta azul dos voluntários/);
  assert.match(textOf(comCor), /Primeira vez aqui\?/);
  assert.match(textOf(comCor), /Você está em casa\./);
});

test("mensagem: mascote só quando pedido e quando a imagem carrega; conjunto desconhecido ou sem frase pra agora não aparece; texto nunca vira HTML", async () => {
  assert.ok((await messageScene().show({ set: "welcome", mascot: true })).querySelector(".ms-message-mascot"));
  assert.equal((await messageScene().show({ set: "welcome" })).querySelector(".ms-message-mascot"), null, "sem params.mascot");
  const semImagem = await messageScene({ preload: async () => { throw new Error("404"); } }).show({ set: "welcome", mascot: true });
  assert.equal(semImagem.querySelector(".ms-message-mascot"), null, "imagem que falha: a cena segue sem o mascote");
  assert.equal(await messageScene().show({ set: "nao-existe" }), MURAL_SKIP);
  const vazio = { greeting: { kicker: "k", mode: "daypart", items: [{ from: "05:00", until: "06:00", text: "Só de madrugada" }] } };
  assert.equal(await messageScene({ sets: vazio }).show({ set: "greeting" }, at("15:00")), MURAL_SKIP, "fora de toda janela");
  const html2 = await messageScene({ sets: { x: { kicker: "<i>k</i>", mode: "fixed", items: [{ text: "<b>oi</b>" }] } } }).show({ set: "x" });
  assert.equal(html2.querySelector("b"), null);
  assert.equal(html2.querySelector("i"), null);
  assert.match(textOf(html2), /<b>oi<\/b>/);
});
