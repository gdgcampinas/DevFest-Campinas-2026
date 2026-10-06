/**
 * Testes de TELA do pódio nos cards da grade (docs/js/features/contest-results.js): o card do Coding Jam nasce com os lugares vazios e,
 * quando o moderador publica o pódio, ganha o projeto e a pessoa de cada um. Confere também a economia de leituras (só depois do fim, só
 * até o pódio aparecer) e que palestra comum nunca é lida. Repository falso do pódio (o mesmo mock do quadro das perguntas).
 *   node --test DevFestIA/tools/dom/contest-results.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, flush, settle, textOf } = require("../lib/dom-harness.js");
const { createFakeBoards } = require("../lib/fake-question-world.js");

const KEY = "2026-11-28T17:15:00.000Z|mobile";
const OTHER = "2026-11-28T13:30:00.000Z|ia";
const site = loadSite({
  scripts: [...SITE_BASE, "data/talk-formats.js", "data/talk-contest.js", "components/avatar.js", "components/speaker-link.js", "components/favorite-button.js", "components/person-card.js",
    "components/talk-highlight.js", "components/talk-meta.js", "components/track-card.js", "features/question-window.js", "features/contest-results.js"],
});
const { window, document } = site;
test.after(() => window.close());
const initContestResults = site.get("initContestResults");
const trackCardMarkup = site.get("trackCardMarkup");
const config = { ...site.get("TALK_CONTEST"), resultsPollMs: 100000 }; // o ciclo automático não interfere nas contagens (teste dele à parte)

const track = { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", color: "#34A853", room: "Sala Lagoa do Taquaral" };
const jam = { title: "GDG Campinas Coding Jam", format: "workshop", speakers: [], highlight: "codejam" };
const normal = { title: "Compose avançado", format: "palestra", speakers: [{ name: "Ana" }] };
const entryOf = (key, data) => ({ key, data, slot: { start: new Date(key.split("|")[0]), end: new Date(new Date(key.split("|")[0]).getTime() + 40 * 60000) } });
const index = new Map([[KEY, entryOf(KEY, jam)], [OTHER, entryOf(OTHER, normal)]]);
const AFTER = new Date("2026-11-28T18:10:00Z");
const DURING = new Date("2026-11-28T17:30:00Z");
const PODIUM = [{ place: 1, project: "App da Ana", name: "Ana" }, { place: 2, project: "<b>Jogo</b>", name: "Bia" }];

/** Página com o card do Coding Jam e o de uma palestra comum, e o pódio falso ligado. */
async function setup({ now = AFTER, enforceWindow = true, pollMs = config.resultsPollMs } = {}) {
  document.body.innerHTML = `<div id="host">${trackCardMarkup(track, jam, { talkKey: KEY, slotIndex: 1 })}${trackCardMarkup({ ...track, id: "ia" }, normal, { talkKey: OTHER, slotIndex: 0 })}</div>`;
  const results = createFakeBoards();
  const reads = [];
  const get = results.get;
  results.get = async key => { reads.push(key); return get(key); };
  const api = initContestResults(document.getElementById("host"), { index, config: { ...config, resultsPollMs: pollMs }, enforceWindow, now: () => now, deps: () => ({ results }) });
  const slots = () => [...document.querySelectorAll(`.talk--highlight[data-talk-key="${KEY}"] .talk-podium-slot`)].map(textOf);
  await settle(); // a primeira conferência roda ao iniciar (whenReady)
  return { results, reads, api, slots };
}

test("o card nasce com os lugares vazios; com o pódio publicado, cada lugar ganha projeto e pessoa", async () => {
  const world = await setup();
  assert.deepEqual(world.slots(), ["1º lugar", "2º lugar", "3º lugar"]);
  world.results.emit(KEY, { podium: PODIUM });
  await world.api.scan();
  const slots = world.slots();
  assert.match(slots[0], /1º lugar.*App da Ana.*Ana/);
  assert.match(slots[1], /2º lugar.*<b>Jogo<\/b>.*Bia/, "o texto vindo do banco é escapado");
  assert.equal(slots[2], "3º lugar", "lugar sem vencedor continua vazio");
  assert.equal(document.querySelectorAll(".talk-podium b b").length, 0);
});

test("durante a sessão (trava de horário ligada) não lê nada: o pódio só pode existir depois do fim", async () => {
  const world = await setup({ now: DURING });
  world.results.emit(KEY, { podium: PODIUM });
  await world.api.scan();
  assert.equal(world.reads.length, 0);
  assert.deepEqual(world.slots(), ["1º lugar", "2º lugar", "3º lugar"]);
});

test("sem pódio ainda: lê de novo a cada conferência; quando sai, preenche e PARA de ler", async () => {
  const world = await setup();
  assert.equal(world.reads.length, 1, "a conferência inicial");
  await world.api.scan();
  assert.equal(world.reads.length, 2);
  world.results.emit(KEY, { podium: PODIUM });
  await world.api.scan();
  assert.equal(world.reads.length, 3);
  await world.api.scan();
  await world.api.scan();
  assert.equal(world.reads.length, 3, "já sabe o resultado: não lê mais");
  assert.equal(document.querySelectorAll(".talk-podium-slot--won").length, 2);
});

test("o ciclo automático confere sozinho até o pódio aparecer", async () => {
  const world = await setup({ pollMs: 30 });
  await flush(100);
  assert.ok(world.reads.length >= 2, "relê sozinho enquanto não há pódio");
  world.results.emit(KEY, { podium: PODIUM });
  await flush(100);
  const reads = world.reads.length;
  assert.match(world.slots()[0], /App da Ana/);
  await flush(100);
  assert.equal(world.reads.length, reads, "achou: parou de ler");
});

test("reaplicar o pódio não duplica nem redesenha o que já está preenchido", async () => {
  const world = await setup();
  world.results.emit(KEY, { podium: PODIUM });
  await world.api.scan();
  const first = document.querySelector(".talk--highlight .talk-podium");
  await world.api.scan();
  assert.equal(document.querySelectorAll(".talk--highlight .talk-podium").length, 1);
  assert.equal(document.querySelector(".talk--highlight .talk-podium"), first, "o mesmo elemento");
});

test("trava de horário desligada (DEV): confere o pódio mesmo com a sessão 'aberta'", async () => {
  const world = await setup({ now: DURING, enforceWindow: false });
  world.results.emit(KEY, { podium: PODIUM });
  await world.api.scan();
  assert.match(world.slots()[0], /App da Ana/);
});

test("palestra comum nunca é lida", async () => {
  const world = await setup();
  assert.deepEqual(world.reads, [KEY], "só a sessão com concurso");
});

test("falha ao ler (offline): não quebra e tenta de novo no próximo ciclo", async () => {
  const world = await setup();
  world.results.get = async () => { throw new Error("offline"); };
  await world.api.scan();
  assert.deepEqual(world.slots(), ["1º lugar", "2º lugar", "3º lugar"]);
});
