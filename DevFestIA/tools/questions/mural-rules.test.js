/**
 * Testa as REGRAS do Firestore da lista de fotos escondidas do mural (`mural-hidden/<álbum>`) contra o emulador (nada toca o banco real): o mural lê o documento do álbum pelo id,
 * só o moderador grava (com o horário do servidor, no máximo 500 ids), ninguém lista nem apaga.
 *   DevFestIA/tools/questions/run-rules-tests.sh
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { createDoc, updateDoc, deleteDoc, getDoc, query } = require("../lib/firestore-emulator.js");
const { skip, person, moderator, base, denied, allowed } = require("../lib/rules-test-kit.js");

const hiddenData = (ids = ["AF1QipAAA"], extra = {}) => ({ edition: base.edition, ids, ...extra });
const putHidden = (who, album, data = hiddenData()) => createDoc(who, "mural-hidden", album, data, { stamp: "updatedAt" });

test("mural-hidden: o moderador grava a lista de ids do álbum e pode regravar (voltar ao ar = lista sem o id)", { skip }, async () => {
  const mod = moderator();
  allowed(await putHidden(mod, "ao-vivo", hiddenData(["AF1QipAAA", "AF1QipBBB"])));
  allowed(await putHidden(mod, "ao-vivo", hiddenData(["AF1QipBBB"])), "o app regrava o documento inteiro (setDoc), que as regras veem como update");
  allowed(await putHidden(mod, "elotech-agibank", hiddenData([])), "lista vazia vale (nada escondido)");
});

test("mural-hidden: o mural (login anônimo) lê o documento pelo id, mas ninguém lista e sem login não lê", { skip }, async () => {
  const mod = moderator();
  allowed(await putHidden(mod, "ao-vivo"));
  allowed(await getDoc(person(), "mural-hidden", "ao-vivo"));
  denied(await getDoc(null, "mural-hidden", "ao-vivo"));
  denied(await query(person(), "mural-hidden", { edition: "2026" }));
  denied(await query(mod, "mural-hidden", { edition: "2026" }), "nem o moderador lista");
});

test("mural-hidden: plateia (anônimo) e conta Google que não é moderadora não gravam", { skip }, async () => {
  denied(await putHidden(person(), "ao-vivo"));
  denied(await putHidden(null, "ao-vivo"));
  const mod = moderator();
  allowed(await putHidden(mod, "ao-vivo"));
  denied(await putHidden(person(), "ao-vivo", hiddenData(["outra"])), "nem regravando um documento que já existe");
  denied(await updateDoc(person(), "mural-hidden", "ao-vivo", { ids: [] }));
});

test("mural-hidden: só o formato certo é aceito (campos, edição conhecida, horário do servidor, lista de no máximo 500)", { skip }, async () => {
  const mod = moderator();
  denied(await putHidden(mod, "ao-vivo", hiddenData(["a"], { extra: 1 })), "campo a mais");
  denied(await putHidden(mod, "ao-vivo", { edition: base.edition }), "sem a lista");
  denied(await putHidden(mod, "ao-vivo", hiddenData("AF1QipAAA")), "ids que não é lista");
  denied(await putHidden(mod, "ao-vivo", { ...hiddenData(), edition: "1999" }), "edição desconhecida");
  denied(await createDoc(mod, "mural-hidden", "ao-vivo", hiddenData(), { stamp: "criadoEm" }), "sem o horário do servidor");
  denied(await putHidden(mod, "ao-vivo", hiddenData(Array.from({ length: 501 }, (_, i) => `id${i}`))), "501 ids");
  allowed(await putHidden(mod, "ao-vivo", hiddenData(Array.from({ length: 500 }, (_, i) => `id${i}`))), "500 ids ainda vale");
});

test("mural-hidden: o id do álbum só aceita letras minúsculas, números e hífen; ninguém apaga", { skip }, async () => {
  const mod = moderator();
  denied(await putHidden(mod, "Ao Vivo"));
  denied(await putHidden(mod, "ao_vivo"));
  denied(await putHidden(mod, "a".repeat(41)));
  allowed(await putHidden(mod, "devfest-2025"));
  denied(await deleteDoc(mod, "mural-hidden", "devfest-2025"));
});

// ---------- controle remoto (`mural-control/current`) ----------
const controlData = (extra = {}) => ({ edition: base.edition, notices: [], emergency: null, hold: null, reload: 0, ...extra });
const putControl = (who, data = controlData(), id = "current") => createDoc(who, "mural-control", id, data, { stamp: "updatedAt" });
const notice = (extra = {}) => ({ id: "n1", text: "Sala B começa em 5 minutos", kind: "info", until: 1_800_000_000_000, ...extra });

test("mural-control: o moderador grava avisos, pausa, recarga e emergência (e regrava o documento inteiro); o mural lê pelo id, ninguém lista, sem login não lê", { skip }, async () => {
  const mod = moderator();
  allowed(await putControl(mod, controlData({ notices: [notice(), notice({ id: "n2", kind: "alert" })] })));
  allowed(await putControl(mod, controlData({ hold: { sceneId: "agora", until: 1_800_000_000_000 }, reload: 1_800_000_000_001 })), "regrava (update)");
  allowed(await putControl(mod, controlData({ hold: { sceneId: null, until: 1_800_000_000_000 } })), "pausa sem cena");
  allowed(await putControl(mod, controlData({ emergency: { text: "Evacuação: sigam as saídas", since: 1_800_000_000_000 } })));
  allowed(await getDoc(person(), "mural-control", "current"));
  denied(await getDoc(null, "mural-control", "current"));
  denied(await query(person(), "mural-control", { edition: "2026" }));
  denied(await query(mod, "mural-control", { edition: "2026" }), "nem o moderador lista");
  denied(await deleteDoc(mod, "mural-control", "current"));
});

test("mural-control: plateia (anônimo) e conta Google que não é moderadora não gravam", { skip }, async () => {
  denied(await putControl(person()));
  denied(await putControl(null));
  allowed(await putControl(moderator()));
  denied(await putControl(person(), controlData({ emergency: { text: "alarme falso", since: 1 } })), "nem regravando o documento que já existe");
  denied(await updateDoc(person(), "mural-control", "current", { reload: 5 }));
});

test("mural-control: só o documento 'current' e só o formato fechado (campos, edição, horário do servidor)", { skip }, async () => {
  const mod = moderator();
  denied(await putControl(mod, controlData(), "outro"), "outro id de documento");
  denied(await putControl(mod, controlData({ extra: 1 })), "campo a mais");
  const { reload, ...semReload } = controlData();
  denied(await putControl(mod, semReload), "faltou o campo reload");
  denied(await putControl(mod, controlData({ edition: "1999" })), "edição desconhecida");
  denied(await createDoc(mod, "mural-control", "current", controlData(), { stamp: "criadoEm" }), "sem o horário do servidor");
  denied(await putControl(mod, controlData({ reload: "agora" })), "reload que não é número");
});

test("mural-control: limites dos avisos (no máximo 5, texto de 1 a 140, tipo info ou alert, campos fechados), da emergência (até 160) e da pausa (cena até 40)", { skip }, async () => {
  const mod = moderator();
  const five = Array.from({ length: 5 }, (_, i) => notice({ id: `n${i}` }));
  allowed(await putControl(mod, controlData({ notices: five })), "5 avisos ainda vale");
  denied(await putControl(mod, controlData({ notices: [...five, notice({ id: "n6" })] })), "6 avisos");
  allowed(await putControl(mod, controlData({ notices: [notice({ text: "x".repeat(140) })] })), "140 caracteres vale");
  denied(await putControl(mod, controlData({ notices: [notice({ text: "x".repeat(141) })] })), "141 caracteres");
  denied(await putControl(mod, controlData({ notices: [notice({ text: "" })] })), "aviso vazio");
  denied(await putControl(mod, controlData({ notices: [notice({ kind: "urgente" })] })), "tipo desconhecido");
  denied(await putControl(mod, controlData({ notices: [notice({ extra: 1 })] })), "campo a mais no aviso");
  denied(await putControl(mod, controlData({ notices: [notice({ until: "amanhã" })] })), "validade que não é número");
  denied(await putControl(mod, controlData({ notices: [{ ...notice(), id: "x".repeat(41) }] })), "id de aviso grande");
  denied(await putControl(mod, controlData({ notices: [five[0], five[1], five[2], five[3], notice({ id: "z", text: "x".repeat(141) })] })), "a 5ª posição também é conferida");
  allowed(await putControl(mod, controlData({ emergency: { text: "x".repeat(160), since: 1 } })), "160 vale");
  denied(await putControl(mod, controlData({ emergency: { text: "x".repeat(161), since: 1 } })), "161");
  denied(await putControl(mod, controlData({ emergency: { text: "", since: 1 } })), "emergência sem texto");
  denied(await putControl(mod, controlData({ emergency: { text: "ok", since: 1, extra: true } })), "campo a mais na emergência");
  denied(await putControl(mod, controlData({ hold: { sceneId: "x".repeat(41), until: 1 } })), "cena grande demais");
  denied(await putControl(mod, controlData({ hold: { sceneId: "agora" } })), "pausa sem prazo");
});
