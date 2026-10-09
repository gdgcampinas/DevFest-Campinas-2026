/**
 * Regras puras das mensagens do mural (docs/js/features/mural-messages.js): variáveis com texto de reserva e a escolha da frase por posição, fixa ou por horário/bloco da grade.
 *   node --test DevFestIA/tools/mural/messages.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { fillMessage, pickMessage } = load("features/mural-messages.js");

test("variável preenchida entra na frase; vazia ou inexistente cai no texto de reserva, ou tira a linha de apoio", () => {
  const item = { text: "Oi, {nome}!", fallbackText: "Oi!", hint: "Procure a camiseta {cor}.", fallbackHint: "Procure a equipe." };
  assert.deepEqual(fillMessage(item, { nome: "Ana", cor: "azul" }), { text: "Oi, Ana!", hint: "Procure a camiseta azul." });
  assert.deepEqual(fillMessage(item, { nome: "", cor: "" }), { text: "Oi!", hint: "Procure a equipe." });
  assert.deepEqual(fillMessage(item, {}), { text: "Oi!", hint: "Procure a equipe." }, "variável inexistente vale como vazia");
  assert.deepEqual(fillMessage({ text: "Sem variável", hint: "{cor}" }, {}), { text: "Sem variável", hint: null }, "sem reserva a linha some");
  assert.equal(fillMessage({ text: "Oi, {nome}!" }, {}), null, "sem texto de reserva o item é descartado");
  assert.deepEqual(fillMessage({ text: "Texto puro" }), { text: "Texto puro", hint: null });
});

test("rotate usa a posição pedida e dá a volta (também com posição negativa); fixed é sempre o primeiro; conjunto vazio devolve null", () => {
  const set = { mode: "rotate", items: [{ text: "a" }, { text: "b" }, { text: "c" }] };
  assert.deepEqual([0, 1, 2, 3, 7, -1].map(index => pickMessage({ set, index }).text), ["a", "b", "c", "a", "b", "c"]);
  assert.equal(pickMessage({ set: { mode: "fixed", items: [{ text: "x" }, { text: "y" }] }, index: 5 }).text, "x");
  assert.equal(pickMessage({ set: { mode: "rotate", items: [] } }), null);
});

test("daypart: o bloco da grade vence a janela de horário; a janela vale de HH:MM (inclusive) até HH:MM (exclusive), inclusive a que passa da meia-noite; fora de toda janela é null", () => {
  const set = { mode: "daypart", items: [
    { moments: ["back-to-room"], text: "volta" },
    { from: "05:00", until: "12:00", text: "dia" },
    { from: "12:00", until: "18:00", text: "tarde" },
    { from: "18:00", until: "05:00", text: "noite" },
  ] };
  const text = (localTime, moment = null) => pickMessage({ set, localTime, moment })?.text;
  assert.deepEqual(["05:00", "11:59", "12:00", "17:59", "18:00", "23:59", "00:00", "04:59"].map(time => text(time)), ["dia", "dia", "tarde", "tarde", "noite", "noite", "noite", "noite"]);
  assert.equal(text("13:25", "back-to-room"), "volta");
  assert.equal(text("13:25", "lunch"), "tarde", "outro bloco não muda a frase");
  assert.equal(pickMessage({ set: { mode: "daypart", items: [{ from: "05:00", until: "06:00", text: "x" }] }, localTime: "15:00" }), null);
});
