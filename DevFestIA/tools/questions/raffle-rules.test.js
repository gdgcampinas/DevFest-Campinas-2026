/**
 * Testa as REGRAS do Firestore do sorteio (raffle-checkins, raffle-entries, raffle-draws) contra o emulador.
 * Roda pelo run-rules-tests.sh, que repete com os interruptores das regras desligados (como está no arquivo) e
 * ligados (cópia temporária): RULES_RAFFLE_CODE=on (QR que muda) e RULES_RAFFLE_TICKET=on (1 ingresso = 1 cadastro).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, updateDoc, deleteDoc, getDoc, query, seed } = require("../lib/firestore-emulator.js");
const { skip, nextId, person, moderator, base, denied, allowed } = require("../lib/rules-test-kit.js");

const codeOn = process.env.RULES_RAFFLE_CODE === "on";
const ticketOn = process.env.RULES_RAFFLE_TICKET === "on";
const onlyFlagsOff = skip || (codeOn || ticketOn ? "só vale com os interruptores do sorteio desligados" : false);

const raffleCheckin = (who, extra = {}) => createDoc(who, "raffle-checkins", `${who.uid}_raffle`, { ...base, entryKey: "raffle", ...extra });
const raffleEntry = (who, extra = {}, docId = `${who.uid}_raffle`) => createDoc(who, "raffle-entries", docId, { ...base, entryKey: "raffle", firstName: "Ana", lastName: "Souza", ...extra });
/** O moderador publica o código do QR (atual e, se houver, o anterior): `updatedAt` é o horário do servidor. */
const publishCode = (who, code, previous) => createDoc(who, "raffle-session", "current", { edition: "2026", code, ...(previous ? { previous } : {}) }, { stamp: "updatedAt" });
const onlyTicketOn = skip || (ticketOn ? false : "só vale com o interruptor do ingresso ligado");
const onlyTicketOff = skip || (ticketOn ? "só vale com o interruptor do ingresso desligado" : false);
const onlyCodeOn = skip || (codeOn ? false : "só vale com o interruptor do QR que muda ligado");
const draw = (who, entryId, extra = {}, docId = `${entryId}_draw`) => createDoc(who, "raffle-draws", docId, { ...base, entryKey: "draw", entryId, name: "Ana Souza", prize: 1, status: "winner", round: 1, ...extra });

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

test("sorteios feitos: só o moderador lê e lista", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  allowed(await draw(mod, entryId));
  const docId = `${entryId}_draw`;
  denied(await getDoc(person(), "raffle-draws", docId));
  denied(await query(person(), "raffle-draws", { edition: "2026" }));
  allowed(await getDoc(mod, "raffle-draws", docId));
  allowed(await query(mod, "raffle-draws", { edition: "2026" }));
});

// ---------- QR que muda: o documento do código ----------
test("código do QR: só o moderador grava e lê; formato, campos e id fixos", { skip }, async () => {
  const mod = moderator();
  const who = person();
  denied(await publishCode(who, "ABCD2345"));
  denied(await publishCode(null, "ABCD2345"));
  denied(await publishCode(mod, "abc")); // curto e minúsculo
  denied(await publishCode(mod, "ABCD2345", "x")); // anterior fora do formato
  denied(await createDoc(mod, "raffle-session", "current", { edition: "2026", code: "ABCD2345", extra: "x" }, { stamp: "updatedAt" }));
  denied(await createDoc(mod, "raffle-session", "outro", { edition: "2026", code: "ABCD2345" }, { stamp: "updatedAt" }));
  denied(await createDoc(mod, "raffle-session", "current", { edition: "1999", code: "ABCD2345" }, { stamp: "updatedAt" }));
  allowed(await publishCode(mod, "ABCD2345"));
  allowed(await publishCode(mod, "EFGH6789", "ABCD2345")); // a virada regrava o mesmo documento
  allowed(await getDoc(mod, "raffle-session", "current"));
  denied(await getDoc(who, "raffle-session", "current")); // a plateia nunca lê o código
  denied(await query(who, "raffle-session", { edition: "2026" }));
});

// ---------- QR que muda: interruptor desligado (como está hoje) ----------
test("check-in do sorteio com o interruptor desligado: aceita com ou sem código, mas o código tem limite de tamanho", { skip: onlyFlagsOff }, async () => {
  allowed(await raffleCheckin(person(), { code: "1" }));
  allowed(await raffleCheckin(person(), { code: "qualquer-coisa" }));
  allowed(await raffleCheckin(person()));
  denied(await raffleCheckin(person(), { code: "x".repeat(41) }));
  denied(await raffleCheckin(person(), { code: 123 }));
});

// ---------- QR que muda: interruptor ligado ----------
test("check-in do sorteio com o QR que muda: sem código ou com código errado é recusado", { skip: onlyCodeOn }, async () => {
  const mod = moderator();
  allowed(await publishCode(mod, "ATUAL234"));
  denied(await raffleCheckin(person()));
  denied(await raffleCheckin(person(), { code: "ERRADO23" }));
  denied(await raffleCheckin(person(), { code: "1" })); // o link antigo ?checkin=1 não vale mais
  denied(await raffleCheckin(person(), { code: 123 }));
  allowed(await raffleCheckin(person(), { code: "ATUAL234" }));
});

test("check-in do sorteio com o QR que muda: o código anterior vale até a virada seguinte, o mais velho não", { skip: onlyCodeOn }, async () => {
  const mod = moderator();
  allowed(await publishCode(mod, "PRIMEIRO2"));
  allowed(await publishCode(mod, "SEGUNDO23", "PRIMEIRO2"));
  allowed(await raffleCheckin(person(), { code: "PRIMEIRO2" })); // quem escaneou na virada
  allowed(await raffleCheckin(person(), { code: "SEGUNDO23" }));
  allowed(await publishCode(mod, "TERCEIRO2", "SEGUNDO23"));
  denied(await raffleCheckin(person(), { code: "PRIMEIRO2" })); // a foto do QR de 2 viradas atrás não vale
  allowed(await raffleCheckin(person(), { code: "SEGUNDO23" }));
  allowed(await raffleCheckin(person(), { code: "TERCEIRO2" }));
});

test("check-in do sorteio com o QR que muda: a mesma pessoa não faz o check-in duas vezes", { skip: onlyCodeOn }, async () => {
  const mod = moderator();
  allowed(await publishCode(mod, "CODIGO234"));
  const who = person();
  allowed(await raffleCheckin(who, { code: "CODIGO234" }));
  denied(await raffleCheckin(who, { code: "CODIGO234" }));
  allowed(await getDoc(who, "raffle-checkins", `${who.uid}_raffle`)); // e ela consegue ver que já tem (a tela usa isso)
});

test("cadastro com o QR que muda: o check-in com código válido libera o cadastro", { skip: onlyCodeOn || (ticketOn ? "com o ingresso ligado o cadastro usa a chave da inscrição (testado abaixo)" : false) }, async () => {
  const mod = moderator();
  allowed(await publishCode(mod, "LIBERA234"));
  const who = person();
  denied(await raffleEntry(who));
  allowed(await raffleCheckin(who, { code: "LIBERA234" }));
  allowed(await raffleEntry(who));
});

// ---------- 1 ingresso = 1 cadastro ----------
const ticketKey = letter => `2026_${letter.repeat(64)}`;
/** Inscrição do Sympla (gravada pelo job, que ignora as regras): o cadastro por ingresso exige que ela exista. */
async function registration(id) {
  allowed(await seed("registrations", id, { edition: "2026", ticketName: "Grátis" }));
  return id;
}
/** Check-in do sorteio da pessoa, já com o código do QR quando esse interruptor também está ligado. */
async function checkedIn(who) {
  if (!codeOn) return allowed(await raffleCheckin(who));
  allowed(await publishCode(moderator(), "INGRESSO234"));
  return allowed(await raffleCheckin(who, { code: "INGRESSO234" }));
}

test("ingresso desligado: cadastro com a chave de inscrição como id é recusado (vale o <uid>_raffle)", { skip: onlyTicketOff }, async () => {
  const who = person();
  await checkedIn(who);
  const id = await registration(ticketKey("a"));
  denied(await raffleEntry(who, {}, id));
  allowed(await raffleEntry(who));
});

test("ingresso ligado: cadastro com a chave de uma inscrição existente é aceito", { skip: onlyTicketOn }, async () => {
  const who = person();
  await checkedIn(who);
  const id = await registration(ticketKey("b"));
  allowed(await raffleEntry(who, {}, id));
});

test("ingresso ligado: 2º celular com o mesmo e-mail (mesma chave) é recusado, outro ingresso passa", { skip: onlyTicketOn }, async () => {
  const first = person();
  const second = person();
  const other = person();
  await checkedIn(first);
  await checkedIn(second);
  await checkedIn(other);
  const id = await registration(ticketKey("c"));
  const otherId = await registration(ticketKey("d"));
  allowed(await raffleEntry(first, {}, id));
  denied(await raffleEntry(second, { firstName: "Bia" }, id)); // mesma inscrição em outro aparelho
  denied(await raffleEntry(first, { lastName: "Outro" }, id)); // e o mesmo aparelho também não repete
  allowed(await raffleEntry(other, { firstName: "Caio" }, otherId));
});

test("ingresso ligado: sem inscrição, id fora do formato, edição trocada ou id <uid>_raffle são recusados", { skip: onlyTicketOn }, async () => {
  const who = person();
  await checkedIn(who);
  denied(await raffleEntry(who, {}, ticketKey("e"))); // a inscrição não existe
  const real = await registration(ticketKey("f"));
  denied(await raffleEntry(who, {}, `${who.uid}_raffle`)); // o id antigo não vale mais
  denied(await raffleEntry(who, {}, real.toUpperCase().replace("2026_", "2026_"))); // hexadecimal maiúsculo
  denied(await raffleEntry(who, {}, `2026_${"f".repeat(63)}`)); // curto
  denied(await raffleEntry(who, {}, `2026_${"g".repeat(64)}`)); // não é hexadecimal
  const other = await registration(`2025_${"f".repeat(64)}`);
  denied(await raffleEntry(who, {}, other)); // a edição do id (2025) não é a do cadastro (2026)
  allowed(await raffleEntry(who, {}, real));
});

test("ingresso ligado: sem o check-in do sorteio o cadastro é recusado, mesmo com inscrição", { skip: onlyTicketOn }, async () => {
  const who = person();
  const id = await registration(ticketKey("1"));
  denied(await raffleEntry(who, {}, id));
  await checkedIn(who);
  allowed(await raffleEntry(who, {}, id));
});

test("ingresso ligado: sem login é recusado; o moderador lista e sorteia cadastros por ingresso", { skip: onlyTicketOn }, async () => {
  const who = person();
  await checkedIn(who);
  const id = await registration(ticketKey("2"));
  denied(await createDoc(null, "raffle-entries", id, { ...base, entryKey: "raffle", firstName: "Ana", lastName: "Souza" }));
  allowed(await raffleEntry(who, {}, id));
  const mod = moderator();
  allowed(await query(mod, "raffle-entries", { edition: "2026" }));
  allowed(await draw(mod, id)); // o id do cadastro tem 69 caracteres e entra no id do sorteio
});

// ---------- rodadas: "Resetar" abre a próxima rodada, sem apagar nada ----------
// Este grupo fica por último de propósito: o documento de estado é compartilhado por todos os testes do arquivo.
const publishRound = (who, round, docId = "current", extra = {}) => createDoc(who, "raffle-state", docId, { edition: "2026", round, ...extra }, { stamp: "updatedAt" });

test("rodada: só o moderador lê e grava o estado; o primeiro documento é sempre a rodada 2; forma e id fixos", { skip }, async () => {
  const mod = moderator();
  const who = person();
  denied(await publishRound(who, 2));
  denied(await publishRound(null, 2));
  denied(await publishRound(mod, 1)); // a rodada 1 é a implícita
  denied(await publishRound(mod, 3)); // não pula
  denied(await publishRound(mod, 2, "outro"));
  denied(await publishRound(mod, 2, "current", { extra: "x" }));
  denied(await createDoc(mod, "raffle-state", "current", { edition: "1999", round: 2 }, { stamp: "updatedAt" }));
  denied(await createDoc(mod, "raffle-state", "current", { edition: "2026", round: "2" }, { stamp: "updatedAt" }));
  allowed(await publishRound(mod, 2));
  allowed(await getDoc(mod, "raffle-state", "current"));
  denied(await getDoc(who, "raffle-state", "current"));
  denied(await deleteDoc(mod, "raffle-state", "current"));
});

test("rodada: depois do documento, só anda de 1 em 1 (nunca volta, nunca repete, nunca pula)", { skip }, async () => {
  const mod = moderator();
  denied(await publishRound(mod, 2)); // repetir
  denied(await publishRound(mod, 1)); // voltar
  denied(await publishRound(mod, 4)); // pular
  denied(await publishRound(person(), 3));
  denied(await createDoc(mod, "raffle-state", "current", { edition: "1999", round: 3 }, { stamp: "updatedAt" })); // não troca a edição
  allowed(await publishRound(mod, 3));
  denied(await publishRound(mod, 3));
});

test("sorteio na rodada: só vale na rodada ATUAL (uma tela esquecida em rodada velha é recusada) e o id leva a rodada", { skip }, async () => {
  // estado atual: rodada 3
  const mod = moderator();
  const entryId = await seededEntry();
  denied(await draw(mod, entryId)); // rodada 1, velha
  denied(await draw(mod, entryId, { round: 2 }, `${entryId}_r2_draw`)); // rodada 2, velha
  denied(await draw(mod, entryId, { round: 3 })); // rodada certa, id errado (sem a rodada)
  denied(await draw(mod, entryId, { round: 3 }, `${entryId}_r2_draw`)); // id de outra rodada
  denied(await draw(mod, entryId, { round: "3" }, `${entryId}_r3_draw`)); // rodada não numérica
  denied(await createDoc(mod, "raffle-draws", `${entryId}_r3_draw`, { ...base, entryKey: "draw", entryId, name: "Ana Souza", prize: 1, status: "winner" })); // sem a rodada
  allowed(await draw(mod, entryId, { round: 3 }, `${entryId}_r3_draw`));
  denied(await draw(mod, entryId, { round: 3 }, `${entryId}_r3_draw`)); // a mesma pessoa não sai 2x na mesma rodada
});

test("reset: a mesma pessoa pode sair de novo na rodada seguinte (e a anterior continua guardada, nada é apagado)", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  allowed(await draw(mod, entryId, { round: 3 }, `${entryId}_r3_draw`));
  allowed(await publishRound(mod, 4)); // "Resetar"
  denied(await draw(mod, entryId, { round: 3 }, `${entryId}_r3_draw`)); // rodada velha agora
  allowed(await draw(mod, entryId, { round: 4 }, `${entryId}_r4_draw`)); // a mesma pessoa, na rodada nova
  allowed(await getDoc(mod, "raffle-draws", `${entryId}_r3_draw`)); // o sorteio velho continua lá
  denied(await deleteDoc(mod, "raffle-draws", `${entryId}_r3_draw`));
  denied(await deleteDoc(mod, "raffle-entries", entryId));
});

test("ausente continua funcionando na rodada atual", { skip }, async () => {
  const mod = moderator();
  const entryId = await seededEntry();
  allowed(await draw(mod, entryId, { round: 4 }, `${entryId}_r4_draw`));
  allowed(await updateDoc(mod, "raffle-draws", `${entryId}_r4_draw`, { status: "absent" }));
  denied(await updateDoc(person(), "raffle-draws", `${entryId}_r4_draw`, { status: "absent" }));
});
