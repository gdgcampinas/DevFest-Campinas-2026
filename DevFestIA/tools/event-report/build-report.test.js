const test = require("node:test");
const assert = require("node:assert/strict");
const { buildEventReport, formatEventReport, netPromoterScore } = require("./build-report.js");

const talks = new Map([
  ["a|ia", { title: "Agentes", track: "IA", time: "09:00", speakers: ["Ana", "Bia"] }],
  ["b|mobile", { title: "Compose", track: "Mobile", time: "09:00", speakers: ["Caio"] }],
  ["c|web", { title: "Sem ninguém", track: "Web", time: "10:00", speakers: ["Dora"] }],
]);
const form = { aspects: [{ id: "organizacao", label: "Organização" }, { id: "local", label: "Local" }] };
const input = {
  stats: { total: 200, checkedIn: 150 },
  checkins: [{ entryKey: "a|ia" }, { entryKey: "a|ia" }, { entryKey: "b|mobile" }, { entryKey: "z|old" }],
  talkFeedback: [
    { entryKey: "a|ia", rating: 5, highlight: "Ótima" },
    { entryKey: "a|ia", rating: 3, improve: "Mais tempo", name: "Lu" },
  ],
  eventFeedback: [
    { rating: 4, nps: 10, aspects: { organizacao: 5, local: 3 }, highlight: "Tudo certo" },
    { rating: 5, nps: 6, aspects: { organizacao: 3 } },
    { rating: 3 },
  ],
  talks, form,
};

test("relatório: presença, notas por palestra em ordem da grade, comentários e palestrantes", () => {
  const report = buildEventReport(input);
  assert.equal(report.attendanceRate, 0.75);
  assert.deepEqual(report.talks.map(t => t.key), ["a|ia", "b|mobile", "z|old"]);
  const first = report.talks[0];
  assert.equal(first.title, "Agentes");
  assert.equal(first.average, 4);
  assert.deepEqual(first.distribution.find(d => d.stars === 5), { stars: 5, count: 1 });
  assert.deepEqual(first.comments, [{ kind: "gostou", text: "Ótima", name: undefined }, { kind: "melhorar", text: "Mais tempo", name: "Lu" }]);
  assert.equal(report.talks[2].title, "z|old", "palestra fora da grade aparece pela chave");
  assert.deepEqual(report.speakers.map(s => [s.name, s.average]), [["Ana", 4], ["Bia", 4]]);
});

test("relatório: evento com aspectos, indicação e comentários", () => {
  const { event } = buildEventReport(input);
  assert.equal(event.ratings, 3);
  assert.equal(event.average, 4);
  assert.deepEqual(event.aspects.map(a => [a.id, a.ratings, a.average]), [["organizacao", 2, 4], ["local", 1, 3]]);
  assert.deepEqual(event.nps, { score: 0, answers: 2 });
  assert.equal(event.comments.length, 1);
});

test("indicação: promotores menos detratores", () => {
  assert.equal(netPromoterScore([10, 9, 9, 7, 3]), 40);
  assert.equal(netPromoterScore([]), null);
});

test("texto do relatório traz os números e não quebra sem dados", () => {
  const text = formatEventReport(buildEventReport(input), { edition: "2026" });
  assert.match(text, /Inscritos: \*\*200\*\*/);
  assert.match(text, /\(75\.0%\)/);
  assert.match(text, /### 09:00 · Agentes/);
  assert.match(text, /\| Organização \| 2 \| 4\.00 \|/);
  const empty = formatEventReport(buildEventReport({ stats: { total: 0, checkedIn: 0 }, checkins: [], talkFeedback: [], eventFeedback: [], talks: new Map(), form }), { edition: "2026" });
  assert.match(empty, /nota geral \*\*-\*\*/);
});
