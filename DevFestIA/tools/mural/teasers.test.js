/**
 * "Daqui a pouco" do mural (docs/js/features/mural-teasers.js): início vindo da grade (destaque da sessão ou bloco) ou de uma hora fixa, janela de aviso e a atração que começa primeiro.
 *   node --test DevFestIA/tools/mural/teasers.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { nextTeaser, teaserStart } = load("features/mural-teasers.js");

const at = hhmm => new Date(`2026-11-28T${hhmm}:00-03:00`);
const SCHEDULE = [
  { start: at("09:00"), end: at("09:45"), talks: { ia: { highlight: undefined }, web: {} } },
  { start: at("10:30"), end: at("11:15"), talks: { ia: { highlight: "codejam" } } },
  { start: at("12:00"), end: at("13:20"), banner: "Almoço", moment: "lunch" },
  { start: at("17:15"), end: at("18:00"), banner: "Encerramento", moment: "closing" },
];
const TEASERS = [
  { id: "codejam", title: "Coding Jam", source: { highlight: "codejam" }, leadMinutes: 30 },
  { id: "encerramento", title: "Encerramento", source: { moment: "closing" }, leadMinutes: 20 },
  { id: "sorteio", title: "Sorteio", source: { at: "2026-11-28T16:00:00-03:00" }, leadMinutes: 15 },
];
const idAt = hhmm => nextTeaser({ teasers: TEASERS, schedule: SCHEDULE, now: at(hhmm) })?.teaser.id ?? null;

test("início vem da grade pelo destaque da sessão, pelo bloco ou por uma hora fixa; fonte sem início conhecido devolve null", () => {
  assert.equal(teaserStart({ highlight: "codejam" }, SCHEDULE).getTime(), at("10:30").getTime());
  assert.equal(teaserStart({ moment: "closing" }, SCHEDULE).getTime(), at("17:15").getTime());
  assert.equal(teaserStart({ at: "2026-11-28T16:00:00-03:00" }, SCHEDULE).getTime(), at("16:00").getTime());
  assert.equal(teaserStart({ highlight: "outro" }, SCHEDULE), null);
  assert.equal(teaserStart({ moment: "coffee" }, SCHEDULE), null);
  assert.equal(teaserStart({ at: "" }, SCHEDULE), null);
  assert.equal(teaserStart({ at: "lixo" }, SCHEDULE), null);
  assert.equal(teaserStart({}, SCHEDULE), null);
});

test("só entra dentro da janela de aviso e antes de começar; quando começa, some", () => {
  assert.equal(idAt("09:00"), null, "ainda longe");
  assert.equal(idAt("10:00"), "codejam", "30 min antes: entra");
  assert.equal(idAt("09:59"), null, "31 min antes: ainda não");
  assert.equal(idAt("10:29"), "codejam");
  assert.equal(idAt("10:30"), null, "começou");
  assert.equal(idAt("11:00"), null);
});

test("mais de uma na janela: a que começa primeiro; o resto fica pra depois e a contagem sai certa", () => {
  const teasers = [{ id: "a", title: "A", source: { at: "2026-11-28T16:30:00-03:00" }, leadMinutes: 60 }, { id: "b", title: "B", source: { at: "2026-11-28T16:10:00-03:00" }, leadMinutes: 60 }];
  const picked = nextTeaser({ teasers, schedule: SCHEDULE, now: at("16:00") });
  assert.equal(picked.teaser.id, "b");
  assert.equal(picked.msLeft, 10 * 60000);
  assert.equal(picked.startsAt.getTime(), at("16:10").getTime());
  assert.equal(idAt("17:00"), "encerramento");
  assert.equal(idAt("15:50"), "sorteio");
  assert.equal(nextTeaser({ teasers: [], schedule: SCHEDULE, now: at("10:00") }), null);
});
