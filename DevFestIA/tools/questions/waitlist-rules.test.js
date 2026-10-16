/**
 * Testa as REGRAS do Firestore da lista de espera dos ingressos (`waitlist`) contra o emulador (nada toca o banco real): qualquer aparelho com login cadastra UMA vez (nome e e-mail), só lê o próprio registro, ninguém
 * edita, só o moderador lista e apaga. Formato fechado (campos, tamanhos, e-mail com formato, edição, horário do servidor, id do aparelho).
 *   DevFestIA/tools/questions/run-rules-tests.sh
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, updateDoc, deleteDoc, getDoc, query } = require("../lib/firestore-emulator.js");
const { skip, person, moderator, base, denied, allowed } = require("../lib/rules-test-kit.js");

const entry = (extra = {}) => ({ ...base, entryKey: "interest", name: "Geovanna Silva", email: "geovanna@example.com", source: "home", lang: "pt", ...extra });
const idOf = who => `${who.uid}_interest`;
const join = (who, extra = {}) => createDoc(who, "waitlist", idOf(who), entry(extra));
const joinWithout = (who, ...fields) => {
  const data = entry();
  fields.forEach(field => delete data[field]);
  return createDoc(who, "waitlist", idOf(who), data);
};

test("lista de espera: qualquer aparelho com login entra UMA vez; sem login, no id de outra pessoa, com id ou chave errada ou repetido é recusado", { skip }, async () => {
  const who = person();
  allowed(await join(who));
  denied(await join(who), "entrar de novo (create de documento que já existe)");
  denied(await createDoc(null, "waitlist", "qualquer_interest", entry()), "sem login");
  const other = person();
  denied(await createDoc(who, "waitlist", idOf(other), entry()), "no id de outra pessoa");
  const third = person();
  denied(await createDoc(third, "waitlist", `${third.uid}_outra`, entry({ entryKey: "outra" })), "chave diferente de interest");
  denied(await createDoc(third, "waitlist", `${third.uid}_interest-2`, entry()), "id com sobra");
});

test("lista de espera: formato fechado (nome de 1 a 80, e-mail de 1 a 120 com formato, origem e idioma curtos, edição conhecida, horário do servidor, sem campo a mais)", { skip }, async () => {
  const who = () => person();
  allowed(await join(who(), { name: "n".repeat(80) }), "80 caracteres");
  denied(await join(who(), { name: "n".repeat(81) }), "81 caracteres");
  denied(await join(who(), { name: "" }));
  denied(await join(who(), { name: 5 }));
  allowed(await join(who(), { email: `${"a".repeat(100)}@example.com` }), "e-mail comprido, dentro do limite");
  denied(await join(who(), { email: `${"a".repeat(120)}@example.com` }), "e-mail acima de 120");
  denied(await join(who(), { email: "" }));
  denied(await join(who(), { email: "sem-arroba" }));
  denied(await join(who(), { email: "com espaco@example.com" }));
  denied(await join(who(), { email: "a@b" }), "sem ponto no domínio");
  allowed(await joinWithout(who(), "source", "lang"), "origem e idioma são opcionais");
  denied(await join(who(), { source: "s".repeat(21) }));
  denied(await join(who(), { lang: "idioma" }));
  denied(await join(who(), { extra: 1 }), "campo a mais");
  denied(await join(who(), { edition: "1999" }), "edição desconhecida");
  const noName = entry();
  delete noName.name;
  denied(await createDoc(who(), "waitlist", "x", noName));
  const sem = who();
  denied(await createDoc(sem, "waitlist", idOf(sem), entry(), { stamp: "criadoEm" }), "sem o horário do servidor");
});

test("lista de espera: cada pessoa lê só o próprio registro; só o moderador lista; ninguém edita; só o moderador apaga", { skip }, async () => {
  const mod = moderator();
  const a = person();
  const b = person();
  allowed(await join(a));
  allowed(await join(b));
  allowed(await getDoc(a, "waitlist", idOf(a)), "o próprio");
  denied(await getDoc(a, "waitlist", idOf(b)), "o de outra pessoa");
  denied(await getDoc(null, "waitlist", idOf(a)), "sem login");
  allowed(await getDoc(mod, "waitlist", idOf(b)), "o moderador lê qualquer um");
  const all = await query(mod, "waitlist", { edition: "2026" });
  allowed(all);
  assert.ok(all.ids.includes(idOf(a)) && all.ids.includes(idOf(b)));
  denied(await query(a, "waitlist", { edition: "2026" }), "a plateia não lista");
  denied(await query(null, "waitlist", { edition: "2026" }), "sem login não lista");
  denied(await updateDoc(a, "waitlist", idOf(a), { name: "Outro" }), "a própria pessoa não edita");
  denied(await updateDoc(mod, "waitlist", idOf(a), { name: "Outro" }), "nem o moderador edita");
  denied(await deleteDoc(a, "waitlist", idOf(a)), "a pessoa não apaga");
  denied(await deleteDoc(person(), "waitlist", idOf(a)));
  denied(await deleteDoc(null, "waitlist", idOf(a)));
  allowed(await deleteDoc(mod, "waitlist", idOf(a)), "o moderador apaga (pedido de saída da lista)");
  assert.equal((await getDoc(mod, "waitlist", idOf(a))).status, 404, "o registro sumiu");
});
