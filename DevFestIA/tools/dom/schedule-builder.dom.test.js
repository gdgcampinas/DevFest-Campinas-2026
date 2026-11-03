/**
 * Testes do construtor de grade (docs/js/data/schedule-builder.js) e do selo do palestrante (speakerMetaLine em components/track-card.js): vaga vazia do catálogo
 * sem palestrante quando pedido (line-up real nunca põe alguém onde não foi escalado), rotação do pool mantida por padrão, e "Selo · Cargo · Empresa" na linha da pessoa.
 *   node --test DevFestIA/tools/dom/schedule-builder.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE } = require("../lib/dom-harness.js");

const site = loadSite({ scripts: [...SITE_BASE, "data/schedule-builder.js", "components/track-card.js"] });
test.after(() => site.window.close());
const g = name => site.get(name);

const tracks = [{ id: "a" }, { id: "b" }];
const pool = [{ id: "p1", name: "Pessoa 1" }, { id: "p2", name: "Pessoa 2" }];
const catalog = { getFor: (trackId, index) => (trackId === "a" && index === 0 ? { title: "Escalada", format: "palestra", speakerIds: ["p1"] } : undefined) };
const plan = [{ talks: [{ start: "09:00", end: "09:40" }] }];
const build = placeholderOptions => g("buildSchedule")(plan, { eventTime: hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`), tracks, speakerPool: pool, talkCatalog: catalog, ...(placeholderOptions && { placeholderOptions }) })[0].talks;

test("vaga vazia do catálogo: por padrão rotaciona o pool (mock), com { rotateSpeakers: false } fica sem palestrante", () => {
  const rotated = build();
  assert.equal(rotated.a.speakers[0].id, "p1");
  assert.equal(rotated.b.speakers.length, 1, "o mock preenche a vaga com alguém do pool");
  const real = build({ rotateSpeakers: false });
  assert.equal(real.a.speakers[0].id, "p1", "a palestra escalada continua com a pessoa dela");
  assert.deepEqual([...real.b.speakers], [], "a vaga vazia não ganha ninguém");
  assert.equal(real.b.title, "Título a confirmar");
});

test("linha da pessoa: selo, cargo e empresa na ordem, só o que vier preenchido", () => {
  const line = g("speakerMetaLine");
  assert.equal(line({ badge: "GDE", title: "Staff Engineer", company: "Globo" }), "GDE · Staff Engineer · Globo");
  assert.equal(line({ badge: "GDE", title: "Researcher" }), "GDE · Researcher");
  assert.equal(line({ title: "Tech Lead", company: "" }), "Tech Lead");
  assert.equal(line({ name: "Sem dados" }), "");
});

test("modo DEV do line-up: ?lineup=1 liga, ?lineup=0 desliga mesmo com a aba gravada, sem parâmetro vale o que a aba guardou, sem aba é PROD", () => {
  const want = g("devLineupRequested");
  const tab = value => ({ getItem: key => (key === g("DEV_MODE_STORAGE_KEY") ? value : null) });
  assert.equal(want({ search: "?lineup=1", storage: tab(null) }), true);
  assert.equal(want({ search: "?lineup=0", storage: tab("1") }), false);
  assert.equal(want({ search: "", storage: tab("1") }), true);
  assert.equal(want({ search: "?demo=2026-11-28T09:00", storage: tab(null) }), false);
  assert.equal(want({ search: "", storage: null }), false);
  assert.equal(want({ search: "", storage: { getItem: () => { throw new Error("bloqueado"); } } }), false, "armazenamento bloqueado não derruba a página");
});

test("vaga sem palestra definida vem marcada como `vacant` (o telão a ignora); palestra escalada não", () => {
  const talks = build({ rotateSpeakers: false });
  assert.equal(talks.b.vacant, true);
  assert.equal(talks.a.vacant, undefined);
});
