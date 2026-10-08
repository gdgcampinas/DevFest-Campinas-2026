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
