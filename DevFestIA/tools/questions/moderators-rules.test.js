/**
 * Testa as REGRAS do Firestore da lista de moderadores (`moderators/<e-mail>`) contra o emulador (nada toca o banco real): só o DONO lista, cadastra e apaga; um moderador cadastrado passa a
 * moderar (telão, perguntas) mas não mexe na lista; remover da lista tira o poder; formato fechado (id em minúsculas, e-mail válido, campos certos, `addedBy` verdadeiro, horário do servidor).
 *   DevFestIA/tools/questions/run-rules-tests.sh
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, deleteDoc, getDoc, query } = require("../lib/firestore-emulator.js");
const { google } = require("../lib/firestore-emulator.js");
const { skip, moderator, moderatorEmail, person, base, nextId, denied, allowed } = require("../lib/rules-test-kit.js");

const listedEmail = () => `${nextId("mod")}@gmail.com`;
const modData = (email, extra = {}) => ({ email, addedBy: moderatorEmail, ...extra });
const putModerator = (who, email, data = modData(email)) => createDoc(who, "moderators", email, data);
const asListed = email => google(nextId("l"), email);
const controlData = () => ({ edition: base.edition, notices: [], emergency: null, hold: null, reload: 0 });
const writeControl = who => createDoc(who, "mural-control", "current", controlData(), { stamp: "updatedAt" });

test("moderators: o dono cadastra, lê, lista e remove", { skip }, async () => {
  const owner = moderator();
  const email = listedEmail();
  allowed(await putModerator(owner, email));
  allowed(await getDoc(owner, "moderators", email));
  allowed(await query(owner, "moderators", {}));
  allowed(await deleteDoc(owner, "moderators", email));
});

test("moderators: plateia, conta Google qualquer e moderador cadastrado NÃO cadastram, nem leem, nem listam, nem apagam", { skip }, async () => {
  const owner = moderator();
  const listed = listedEmail();
  allowed(await putModerator(owner, listed));
  for (const who of [person(), null, google(nextId("x"), "qualquer@gmail.com"), asListed(listed)]) {
    denied(await putModerator(who, listedEmail()));
    denied(await getDoc(who, "moderators", listed));
    denied(await query(who, "moderators", {}));
    denied(await deleteDoc(who, "moderators", listed));
  }
});

test("moderators: o dono com e-mail NÃO verificado não vale", { skip }, async () => {
  const unverified = google(nextId("o"), moderatorEmail, false);
  denied(await putModerator(unverified, listedEmail()));
});

test("moderators: o moderador cadastrado passa a moderar (telão) e perde o poder quando o dono o remove", { skip }, async () => {
  const owner = moderator();
  const email = listedEmail();
  const listed = asListed(email);
  denied(await writeControl(listed), "ainda não cadastrado");
  allowed(await putModerator(owner, email));
  allowed(await writeControl(listed));
  allowed(await deleteDoc(owner, "moderators", email));
  denied(await writeControl(listed), "removido da lista");
});

test("moderators: o e-mail do login vale em qualquer caixa (o documento é em minúsculas)", { skip }, async () => {
  const owner = moderator();
  const email = listedEmail();
  allowed(await putModerator(owner, email));
  allowed(await writeControl(google(nextId("u"), email.toUpperCase())));
});

test("moderators: conta Google com e-mail não verificado nunca vira moderadora, mesmo estando na lista", { skip }, async () => {
  const owner = moderator();
  const email = listedEmail();
  allowed(await putModerator(owner, email));
  denied(await writeControl(google(nextId("u"), email, false)));
});

test("moderators: formato fechado (id em minúsculas, e-mail válido, id igual ao campo, campos certos, addedBy verdadeiro, horário do servidor)", { skip }, async () => {
  const owner = moderator();
  const email = listedEmail();
  denied(await putModerator(owner, email.toUpperCase(), modData(email.toUpperCase())), "id com maiúscula");
  denied(await putModerator(owner, "sem-arroba", modData("sem-arroba")), "e-mail inválido");
  denied(await putModerator(owner, "a@b", modData("a@b")), "sem domínio");
  denied(await putModerator(owner, email, modData("outro@gmail.com")), "campo email diferente do id");
  denied(await putModerator(owner, email, modData(email, { extra: 1 })), "campo a mais");
  denied(await putModerator(owner, email, { email }), "sem addedBy");
  denied(await putModerator(owner, email, modData(email, { addedBy: "outro@gmail.com" })), "addedBy que não é o dono");
  denied(await createDoc(owner, "moderators", email, modData(email), { stamp: "criadoEm" }), "sem o horário do servidor");
  denied(await putModerator(owner, `${"x".repeat(250)}@g.com`, modData(`${"x".repeat(250)}@g.com`)), "mais de 254 caracteres");
  allowed(await putModerator(owner, email));
});
