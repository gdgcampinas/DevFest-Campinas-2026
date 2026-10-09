/**
 * Testa as REGRAS do Firestore do mural de recados (`mural-wall`) contra o emulador (nada toca o banco real): a plateia manda até 3 recados pendentes (sem check-in), o moderador aprova, recusa e tira do
 * ar, o telão (login anônimo) lista SÓ os aprovados e ninguém apaga. Formato fechado (campos, tamanho do texto, apelido, edição, horário do servidor, estado de nascimento).
 *   DevFestIA/tools/questions/run-rules-tests.sh
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, updateDoc, deleteDoc, getDoc, query } = require("../lib/firestore-emulator.js");
const { skip, person, moderator, base, denied, allowed } = require("../lib/rules-test-kit.js");

const slotKey = n => `wall-${n}`;
const wallData = (extra = {}, n = 1) => ({ ...base, entryKey: slotKey(n), text: "Vim buscar gente boa pra conversar", prompt: "buscar", status: "pending", ...extra });
const send = (who, n = 1, extra = {}) => createDoc(who, "mural-wall", `${who.uid}_${slotKey(n)}`, wallData(extra, n));
const idOf = (who, n = 1) => `${who.uid}_${slotKey(n)}`;
const listApproved = who => query(who, "mural-wall", { edition: "2026", status: "approved" });

test("recado: qualquer pessoa autenticada manda, sem check-in, até 3 por aparelho; o 4º e o espaço errado são recusados", { skip }, async () => {
  const who = person();
  for (const n of [1, 2, 3]) allowed(await send(who, n));
  denied(await createDoc(who, "mural-wall", `${who.uid}_wall-4`, wallData({ entryKey: "wall-4" })), "4º recado");
  denied(await createDoc(who, "mural-wall", `${who.uid}_wall-0`, wallData({ entryKey: "wall-0" })));
  denied(await createDoc(who, "mural-wall", `${who.uid}_qualquer`, wallData({ entryKey: "qualquer" })));
  denied(await send(who, 1), "reenviar o mesmo espaço (create de documento que já existe)");
  denied(await createDoc(null, "mural-wall", "qualquer_wall-1", wallData()), "sem login");
});

test("recado: o id precisa ser do próprio aparelho e bater com o espaço (ninguém manda no nome de outro nem fura o limite com ids novos)", { skip }, async () => {
  const who = person();
  const other = person();
  denied(await createDoc(who, "mural-wall", `${other.uid}_wall-1`, wallData()), "no id de outra pessoa");
  denied(await createDoc(who, "mural-wall", `${who.uid}_wall-1-extra`, wallData()), "id com sobra");
  denied(await createDoc(who, "mural-wall", `${who.uid}_wall-2`, wallData({ entryKey: "wall-1" })), "id diferente do espaço");
});

test("recado: formato fechado (texto de 1 a 120, pergunta, apelido de até 30, só `pending`, edição conhecida, horário do servidor, sem campo a mais)", { skip }, async () => {
  const who = () => person();
  allowed(await send(who(), 1, { text: "x".repeat(120) }), "120 caracteres");
  denied(await send(who(), 1, { text: "x".repeat(121) }), "121 caracteres");
  denied(await send(who(), 1, { text: "" }));
  denied(await send(who(), 1, { text: 5 }));
  denied(await send(who(), 1, { prompt: "" }), "sem pergunta");
  denied(await send(who(), 1, { prompt: "p".repeat(41) }));
  allowed(await send(who(), 1, { nickname: "Ana" }));
  allowed(await send(who(), 1, { nickname: "n".repeat(30) }));
  denied(await send(who(), 1, { nickname: "n".repeat(31) }));
  denied(await send(who(), 1, { status: "approved" }), "já nasce aprovado");
  denied(await send(who(), 1, { status: "hidden" }));
  denied(await send(who(), 1, { extra: 1 }), "campo a mais");
  denied(await send(who(), 1, { edition: "1999" }), "edição desconhecida");
  const noText = wallData();
  delete noText.text;
  denied(await createDoc(who(), "mural-wall", "x", noText));
  const sem = who();
  denied(await createDoc(sem, "mural-wall", idOf(sem), wallData(), { stamp: "criadoEm" }), "sem o horário do servidor");
});

test("moderação: o moderador aprova, recusa, tira do ar e devolve; só muda o estado e só pra valores conhecidos; ninguém mais mexe", { skip }, async () => {
  const mod = moderator();
  const who = person();
  allowed(await send(who));
  for (const status of ["approved", "hidden", "approved", "rejected"]) allowed(await updateDoc(mod, "mural-wall", idOf(who), { status }), status);
  denied(await updateDoc(mod, "mural-wall", idOf(who), { status: "pending" }), "voltar a pendente");
  denied(await updateDoc(mod, "mural-wall", idOf(who), { status: "qualquer" }));
  denied(await updateDoc(mod, "mural-wall", idOf(who), { text: "outro texto" }), "o moderador não reescreve o texto");
  denied(await updateDoc(mod, "mural-wall", idOf(who), { status: "approved", text: "outro" }));
  denied(await updateDoc(who, "mural-wall", idOf(who), { status: "approved" }), "a própria pessoa não se aprova");
  denied(await updateDoc(person(), "mural-wall", idOf(who), { status: "approved" }));
  denied(await updateDoc(null, "mural-wall", idOf(who), { status: "approved" }));
  denied(await deleteDoc(mod, "mural-wall", idOf(who)), "nem o moderador apaga");
  denied(await deleteDoc(who, "mural-wall", idOf(who)));
});

test("leitura: o telão e a plateia listam SÓ os aprovados (consulta sem o filtro é recusada); o moderador lista tudo; cada pessoa lê o próprio recado e ninguém lê o de outra", { skip }, async () => {
  const mod = moderator();
  const a = person();
  const b = person();
  allowed(await send(a));
  allowed(await send(b));
  allowed(await updateDoc(mod, "mural-wall", idOf(a), { status: "approved" }));
  const viewer = person();
  const approved = await listApproved(viewer);
  allowed(approved);
  assert.deepEqual(approved.ids.filter(id => id === idOf(a) || id === idOf(b)), [idOf(a)], "o pendente não aparece");
  denied(await query(viewer, "mural-wall", { edition: "2026" }), "lista sem o filtro de aprovado");
  denied(await query(viewer, "mural-wall", { edition: "2026", status: "pending" }));
  denied(await listApproved(null), "sem login");
  const all = await query(mod, "mural-wall", { edition: "2026" });
  allowed(all);
  assert.ok(all.ids.includes(idOf(a)) && all.ids.includes(idOf(b)));
  allowed(await getDoc(a, "mural-wall", idOf(a)), "o próprio");
  denied(await getDoc(a, "mural-wall", idOf(b)), "o de outra pessoa");
  allowed(await getDoc(mod, "mural-wall", idOf(b)), "o moderador lê qualquer um");
  denied(await getDoc(null, "mural-wall", idOf(a)));
});

test("tirar do ar: o recado `hidden` some da lista do telão na hora e volta quando aprovado de novo", { skip }, async () => {
  const mod = moderator();
  const who = person();
  allowed(await send(who));
  allowed(await updateDoc(mod, "mural-wall", idOf(who), { status: "approved" }));
  assert.ok((await listApproved(person())).ids.includes(idOf(who)));
  allowed(await updateDoc(mod, "mural-wall", idOf(who), { status: "hidden" }));
  assert.ok(!(await listApproved(person())).ids.includes(idOf(who)));
  allowed(await updateDoc(mod, "mural-wall", idOf(who), { status: "approved" }));
  assert.ok((await listApproved(person())).ids.includes(idOf(who)));
});
