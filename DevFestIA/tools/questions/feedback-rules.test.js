/**
 * Testa as REGRAS do Firestore do check-in e das avaliações (da palestra e do evento) contra o emulador: chave sempre
 * válida, id exatamente "<uid>_<chave>" (uma por pessoa), avaliação da palestra só com check-in e só depois do fim, e os
 * campos/notas de cada formulário. Roda pelo mesmo script das regras das perguntas (run-rules-tests.sh), com a trava de
 * horário ligada e desligada.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createDoc, getDoc } = require("../lib/firestore-emulator.js");
const { skip, onlyWithWindow, onlyWithoutWindow, nextId, person, talkKeyStarted, LIVE, ENDED, base, checkin, attendee, denied, allowed } = require("../lib/rules-test-kit.js");

const talkFeedback = (who, talkKey, extra = {}, docId = `${who.uid}_${talkKey}`) =>
  createDoc(who, "talk-feedback", docId, { ...base, entryKey: talkKey, rating: 5, name: "Ana", ...extra });

const aspectIds = ["organizacao", "local", "alimentacao", "conteudo", "networking", "comunicacao"];
const eventData = (extra = {}) => ({ ...base, entryKey: "event-end", rating: 4, aspects: Object.fromEntries(aspectIds.map(id => [id, 5])), nps: 9, name: "Ana", ...extra });
const eventFeedback = (who, extra = {}, docId = `${who.uid}_event-end`) => createDoc(who, "event-feedback", docId, eventData(extra));

// ---------- check-in ----------
test("check-in: chave de palestra válida e id <uid>_<chave> é aceito, uma vez só", { skip }, async () => {
  const who = person();
  const talk = LIVE();
  allowed(await checkin(who, talk));
  denied(await checkin(who, talk)); // segundo = update
  allowed(await getDoc(who, "checkins", `${who.uid}_${talk}`));
  denied(await getDoc(person(), "checkins", `${who.uid}_${talk}`));
});

test("check-in: chave inventada, id que não bate com a chave, id de outra pessoa, campo a mais e edição desconhecida são recusados", { skip }, async () => {
  const who = person();
  const key = LIVE();
  denied(await checkin(who, "qualquer-coisa"));
  denied(await checkin(who, "2026-11-28T12:00:00.000Z|IA")); // trilha fora do formato
  denied(await createDoc(who, "checkins", `${who.uid}_outro`, { ...base, entryKey: key }));
  denied(await createDoc(who, "checkins", `${nextId("intruso")}_${key}`, { ...base, entryKey: key }));
  denied(await createDoc(who, "checkins", `${who.uid}_${key}`, { ...base, entryKey: key, extra: "x" }));
  denied(await createDoc(who, "checkins", `${who.uid}_${key}`, { edition: "1999", entryKey: key }));
  allowed(await checkin(who, key)); // e o válido passa
});

// ---------- avaliação da palestra ----------
test("avaliação da palestra: com check-in, depois do fim, nota 1-5 e nome, é aceita uma vez", { skip }, async () => {
  const talk = ENDED();
  const who = await attendee(talk);
  allowed(await talkFeedback(who, talk, { highlight: "Gostei", improve: "Nada" }));
  denied(await talkFeedback(who, talk)); // segunda
});

test("avaliação da palestra: sem check-in daquela palestra é recusada", { skip }, async () => {
  const talk = ENDED();
  denied(await talkFeedback(person(), talk));
  const other = ENDED();
  denied(await talkFeedback(await attendee(other), talk)); // check-in em outra palestra não vale
});

test("avaliação da palestra: chave inventada, id trocado, nota fora de 1-5, sem nome e campo a mais são recusados", { skip }, async () => {
  const talk = ENDED();
  const who = await attendee(talk);
  denied(await talkFeedback(who, "qualquer-coisa"));
  denied(await talkFeedback(who, talk, {}, `${who.uid}_outro`));
  denied(await talkFeedback(who, talk, { rating: 0 }));
  denied(await talkFeedback(who, talk, { rating: 6 }));
  denied(await talkFeedback(who, talk, { rating: "5" }));
  denied(await talkFeedback(who, talk, { name: "" }));
  denied(await talkFeedback(who, talk, { extra: "x" }));
  denied(await talkFeedback(who, talk, { highlight: "x".repeat(400) }));
  allowed(await talkFeedback(who, talk)); // e o válido passa
});

test("avaliação da palestra: com a trava de horário ligada, só depois do fim", { skip: onlyWithWindow }, async () => {
  const running = LIVE();
  denied(await talkFeedback(await attendee(running), running));
  const justEnded = talkKeyStarted(41);
  allowed(await talkFeedback(await attendee(justEnded), justEnded));
  const almost = talkKeyStarted(38);
  denied(await talkFeedback(await attendee(almost), almost));
});

test("avaliação da palestra: com a trava desligada (DEV) aceita a qualquer hora", { skip: onlyWithoutWindow }, async () => {
  const running = LIVE();
  allowed(await talkFeedback(await attendee(running), running));
});

// ---------- avaliação do evento ----------
test("avaliação do evento: notas, indicação 0-10 e nome, uma por pessoa", { skip }, async () => {
  const who = person();
  allowed(await eventFeedback(who, { highlight: "Tudo", improve: "Nada" }));
  denied(await eventFeedback(who)); // segunda
  allowed(await getDoc(who, "event-feedback", `${who.uid}_event-end`));
  denied(await getDoc(person(), "event-feedback", `${who.uid}_event-end`));
});

test("avaliação do evento: só a chave do evento vale (nada de várias avaliações com chaves inventadas)", { skip }, async () => {
  const who = person();
  const key = LIVE();
  denied(await eventFeedback(who, { entryKey: "outra" }, `${who.uid}_outra`));
  denied(await eventFeedback(who, { entryKey: key }, `${who.uid}_${key}`));
  denied(await eventFeedback(who, {}, `${who.uid}_outra`)); // chave certa, id trocado
  denied(await eventFeedback(who, {}, `${nextId("intruso")}_event-end`));
});

test("avaliação do evento: nota fora de 1-5, indicação fora de 0-10, aspecto faltando ou a mais, sem nome e campo a mais são recusados", { skip }, async () => {
  const bad = extra => eventFeedback(person(), extra);
  denied(await bad({ rating: 0 }));
  denied(await bad({ rating: 6 }));
  denied(await bad({ nps: -1 }));
  denied(await bad({ nps: 11 }));
  denied(await bad({ nps: "9" }));
  denied(await bad({ name: "" }));
  denied(await bad({ extra: "x" }));
  denied(await bad({ aspects: { organizacao: 5 } }));
  denied(await bad({ aspects: Object.fromEntries([...aspectIds, "intruso"].map(id => [id, 5])) }));
  denied(await bad({ aspects: Object.fromEntries(aspectIds.map(id => [id, 9])) }));
  allowed(await bad({ nps: 0 }));
  allowed(await bad({ nps: 10 }));
});

// ---------- espelho regras x site (não precisa do emulador) ----------
test("regras x site: a chave da avaliação do evento nas regras é a do site", () => {
  const siteKey = fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs/js/features/event-feedback.js"), "utf8").match(/EVENT_FEEDBACK_KEY = "([^"]+)"/)[1];
  const rules = fs.readFileSync(path.join(__dirname, "..", "..", "firebase", "firestore.rules"), "utf8");
  assert.ok(rules.includes(`entryKey == '${siteKey}'`), "a chave do evento nas regras diverge de EVENT_FEEDBACK_KEY (docs/js/features/event-feedback.js)");
});
