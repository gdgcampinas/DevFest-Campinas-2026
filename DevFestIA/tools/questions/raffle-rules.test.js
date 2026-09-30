/**
 * Testa as REGRAS do Firestore do sorteio (raffle-checkins, raffle-entries, raffle-draws) contra o emulador.
 * Roda pelo run-rules-tests.sh, que repete com os interruptores das regras desligados (como está no arquivo) e
 * ligados (cópia temporária): RULES_RAFFLE_CODE=on (QR que muda) e RULES_RAFFLE_TICKET=on (1 ingresso = 1 cadastro).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, updateDoc, getDoc, query, seed } = require("../lib/firestore-emulator.js");
const { skip, nextId, person, moderator, base, denied, allowed } = require("../lib/rules-test-kit.js");

const codeOn = process.env.RULES_RAFFLE_CODE === "on";
const ticketOn = process.env.RULES_RAFFLE_TICKET === "on";
const onlyFlagsOff = skip || (codeOn || ticketOn ? "só vale com os interruptores do sorteio desligados" : false);

const raffleCheckin = (who, extra = {}) => createDoc(who, "raffle-checkins", `${who.uid}_raffle`, { ...base, entryKey: "raffle", ...extra });
const raffleEntry = (who, extra = {}, docId = `${who.uid}_raffle`) => createDoc(who, "raffle-entries", docId, { ...base, entryKey: "raffle", firstName: "Ana", lastName: "Souza", ...extra });
const draw = (who, entryId, extra = {}) => createDoc(who, "raffle-draws", `${entryId}_draw`, { ...base, entryKey: "draw", entryId, name: "Ana Souza", prize: 1, status: "winner", ...extra });

/** Um cadastro já existente no banco (gravado como dono), pra o moderador sortear. */
async function seededEntry() {
  const entryId = nextId("entry_");
  allowed(await seed("raffle-entries", entryId, { ...base, entryKey: "raffle", firstName: "Ana", lastName: "Souza" }));
  return entryId;
}

// ---------- fluxo de sempre (interruptores desligados) ----------
test("sorteio: check-in e cadastro da mesma pessoa passam, uma vez só cada", { skip: onlyFlagsOff }, async () => {
  const who = person();
  allowed(await raffleCheckin(who));
  allowed(await raffleEntry(who));
  denied(await raffleCheckin(who));
  denied(await raffleEntry(who));
});

test("sorteio: sem check-in do sorteio o cadastro é recusado", { skip: onlyFlagsOff }, async () => {
  denied(await raffleEntry(person()));
});

test("sorteio: cadastro com nome vazio, campo a mais, id de outra pessoa ou chave trocada é recusado", { skip: onlyFlagsOff }, async () => {
  const who = person();
  allowed(await raffleCheckin(who));
  denied(await raffleEntry(who, { firstName: "" }));
  denied(await raffleEntry(who, { lastName: "x".repeat(81) }));
  denied(await raffleEntry(who, { extra: "x" }));
  denied(await raffleEntry(who, {}, `${nextId("intruso")}_raffle`));
  denied(await raffleEntry(who, { entryKey: "outra" }));
  allowed(await raffleEntry(who)); // e o válido passa
});

test("sorteio: só o moderador lista os cadastros; a pessoa lê só o próprio", { skip: onlyFlagsOff }, async () => {
  const who = person();
  allowed(await raffleCheckin(who));
  allowed(await raffleEntry(who));
  denied(await query(who, "raffle-entries", { edition: "2026" }));
  allowed(await query(moderator(), "raffle-entries", { edition: "2026" }));
  allowed(await getDoc(who, "raffle-entries", `${who.uid}_raffle`));
  denied(await getDoc(person(), "raffle-entries", `${who.uid}_raffle`));
});

// ---------- sorteios feitos e "ausente" (valem com qualquer interruptor) ----------
test("sorteio feito: o moderador grava como 'winner' uma vez por cadastro; ninguém mais grava", { skip }, async () => {
  const entryId = await seededEntry();
  denied(await draw(person(), entryId));
  const mod = moderator();
  allowed(await draw(mod, entryId));
  denied(await draw(mod, entryId)); // a mesma pessoa não é sorteada 2x
});

test("sorteio feito: status obrigatório e só 'winner' na criação; cadastro inexistente e campo a mais são recusados", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  denied(await draw(mod, entryId, { status: "absent" }));
  denied(await createDoc(mod, "raffle-draws", `${entryId}_draw`, { ...base, entryKey: "draw", entryId, name: "Ana Souza", prize: 1 })); // sem status
  denied(await draw(mod, "nao-existe", {}));
  denied(await draw(mod, entryId, { extra: "x" }));
  denied(await draw(mod, entryId, { prize: 0 }));
  allowed(await draw(mod, entryId));
});

test("ausente: o moderador muda winner para absent uma vez; nada além do status e nada pra outro valor", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  allowed(await draw(mod, entryId));
  const docId = `${entryId}_draw`;
  denied(await updateDoc(mod, "raffle-draws", docId, { prize: 5 }));
  denied(await updateDoc(mod, "raffle-draws", docId, { name: "Outro Nome" }));
  denied(await updateDoc(mod, "raffle-draws", docId, { status: "winner" }));
  denied(await updateDoc(mod, "raffle-draws", docId, { status: "qualquer" }));
  allowed(await updateDoc(mod, "raffle-draws", docId, { status: "absent" }));
  denied(await updateDoc(mod, "raffle-draws", docId, { status: "absent" })); // já era ausente
});

test("ausente: quem não é moderador não altera o sorteio", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  allowed(await draw(mod, entryId));
  const docId = `${entryId}_draw`;
  denied(await updateDoc(person(), "raffle-draws", docId, { status: "absent" }));
  denied(await updateDoc(null, "raffle-draws", docId, { status: "absent" }));
});

test("ausente: sorteio antigo, gravado sem status, também pode virar ausente", { skip }, async () => {
  const entryId = await seededEntry();
  const docId = `${entryId}_draw`;
  allowed(await seed("raffle-draws", docId, { ...base, entryKey: "draw", entryId, name: "Ana Souza", prize: 1 }));
  allowed(await updateDoc(moderator(), "raffle-draws", docId, { status: "absent" }));
});

test("sorteios feitos: só o moderador lê e lista; ninguém apaga", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  allowed(await draw(mod, entryId));
  const docId = `${entryId}_draw`;
  denied(await getDoc(person(), "raffle-draws", docId));
  denied(await query(person(), "raffle-draws", { edition: "2026" }));
  allowed(await getDoc(mod, "raffle-draws", docId));
  allowed(await query(mod, "raffle-draws", { edition: "2026" }));
});
