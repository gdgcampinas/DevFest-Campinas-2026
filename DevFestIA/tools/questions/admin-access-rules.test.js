/**
 * Testa, contra o emulador, QUEM PODE USAR a área de admin: entrar com o Google é aberto a qualquer conta, mas o que a área lê e grava (lista de espera, recados, moderadores, controle do telão, sorteio) só abre
 * para o DONO e para moderadores cadastrados com e-mail verificado. Uma conta Google qualquer (verificada, não cadastrada), uma com o e-mail do dono NÃO verificado, a plateia anônima e quem não está logado
 * são recusados em TODAS as operações de moderação; o moderador cadastrado passa, mas só o dono mexe na lista de moderadores.
 *   DevFestIA/tools/questions/run-rules-tests.sh
 */
const test = require("node:test");
const { createDoc, updateDoc, deleteDoc, getDoc, query, seed, google } = require("../lib/firestore-emulator.js");
const { skip, moderator, moderatorEmail, person, base, nextId, denied, allowed } = require("../lib/rules-test-kit.js");

const owner = () => moderator();
const listedEmail = () => `${nextId("mod")}@gmail.com`;
const strangers = () => [
  ["conta Google qualquer (verificada, não cadastrada)", google(nextId("x"), "qualquer.pessoa@gmail.com")],
  ["e-mail do dono mas NÃO verificado", google(nextId("o"), moderatorEmail, false)],
  ["plateia anônima", person()],
  ["sem login", null],
];

async function listedModerator() {
  const email = listedEmail();
  allowed(await createDoc(owner(), "moderators", email, { email, addedBy: moderatorEmail }));
  return google(nextId("l"), email);
}

test("admin: LER a lista de espera, os recados de todos, os sorteios e o estado do sorteio só vale para o dono e moderador cadastrado", { skip }, async () => {
  const id = nextId("p");
  await seed("waitlist", `${id}_interest`, { ...base, entryKey: "interest", name: "Ana", email: "ana@example.com" });
  await seed("mural-wall", `${id}_wall-1`, { ...base, entryKey: "wall-1", text: "oi", prompt: "buscar", status: "pending" });
  await seed("raffle-state", "current", { ...base, round: 2 });
  const reads = who => [
    ["listar a lista de espera", query(who, "waitlist", { edition: "2026" })],
    ["ler a lista de espera de outra pessoa", getDoc(who, "waitlist", `${id}_interest`)],
    ["listar TODOS os recados (sem o filtro de aprovados)", query(who, "mural-wall", { edition: "2026" })],
    ["ler o recado de outra pessoa", getDoc(who, "mural-wall", `${id}_wall-1`)],
    ["listar os cadastros do sorteio", query(who, "raffle-entries", { edition: "2026" })],
    ["listar os sorteios feitos", query(who, "raffle-draws", { edition: "2026" })],
    ["ler o estado do sorteio", getDoc(who, "raffle-state", "current")],
    ["listar os moderadores", query(who, "moderators", {})],
  ];
  for (const [label, who] of strangers()) for (const [what, result] of reads(who)) denied(await result, `${label}: ${what}`);
  const listed = await listedModerator();
  for (const [what, result] of reads(listed).slice(0, 7)) allowed(await result, `moderador cadastrado: ${what}`);
  denied(await query(listed, "moderators", {}), "moderador cadastrado NÃO lista os moderadores (só o dono)");
  for (const [what, result] of reads(owner())) allowed(await result, `dono: ${what}`);
});

test("admin: GRAVAR (apagar da lista de espera, aprovar recado, controlar o telão, cadastrar moderador) é recusado a qualquer conta que não seja dono ou moderador cadastrado", { skip }, async () => {
  const id = nextId("p");
  await seed("waitlist", `${id}_interest`, { ...base, entryKey: "interest", name: "Ana", email: "ana@example.com" });
  await seed("mural-wall", `${id}_wall-1`, { ...base, entryKey: "wall-1", text: "oi", prompt: "buscar", status: "pending" });
  const control = { edition: base.edition, notices: [], emergency: null, hold: null, reload: 0 };
  for (const [label, who] of strangers()) {
    denied(await deleteDoc(who, "waitlist", `${id}_interest`), `${label}: apagar da lista de espera`);
    denied(await updateDoc(who, "mural-wall", `${id}_wall-1`, { status: "approved" }), `${label}: aprovar recado`);
    denied(await createDoc(who, "mural-control", "current", control, { stamp: "updatedAt" }), `${label}: controlar o telão`);
    denied(await createDoc(who, "moderators", listedEmail(), { email: "x@gmail.com", addedBy: moderatorEmail }), `${label}: cadastrar moderador`);
  }
  const listed = await listedModerator();
  allowed(await updateDoc(listed, "mural-wall", `${id}_wall-1`, { status: "approved" }), "moderador cadastrado aprova recado");
  allowed(await createDoc(listed, "mural-control", "current", control, { stamp: "updatedAt" }), "moderador cadastrado controla o telão");
  denied(await createDoc(listed, "moderators", listedEmail(), { email: "x@gmail.com", addedBy: moderatorEmail }), "moderador cadastrado NÃO cadastra moderador");
  allowed(await deleteDoc(listed, "waitlist", `${id}_interest`), "moderador cadastrado remove da lista de espera");
});

test("admin: a plateia lê o que é público (telão lê o controle e os aprovados) mas nunca o que é de moderação", { skip }, async () => {
  const viewer = person();
  allowed(await getDoc(viewer, "mural-control", "current"), "o telão lê o controle (id conhecido)");
  denied(await query(viewer, "waitlist", { edition: "2026" }), "a plateia não lista a lista de espera");
});
