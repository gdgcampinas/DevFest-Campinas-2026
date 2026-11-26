/**
 * Testa a regra do script de envio (Code.gs, Apps Script) com Firestore e e-mail de mentira: nada sai de verdade.
 *   node --test DevFestIA/tools/invite-mailer/invite-mailer.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { module: { exports: {} } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "Code.gs"), "utf8"), sandbox);
const { handleInvite, LIMITS } = sandbox.module.exports;
const plain = value => JSON.parse(JSON.stringify(value));
const request = (extra = {}) => ({ idToken: "tok", emails: ["ana@gmail.com"], subject: "Assunto", body: "Texto", ...extra });

function deps({ status = 200, moderators = ["ana@gmail.com", "bia@gmail.com"], quota = 100, failAt = "" } = {}) {
  const sent = [];
  const fetched = [];
  const documents = moderators.map(email => ({ name: `projects/p/databases/(default)/documents/moderators/${encodeURIComponent(email)}` }));
  return {
    sent, fetched,
    fetcher: { fetch: (url, options) => { fetched.push({ url, options }); return { getResponseCode: () => status, getContentText: () => JSON.stringify({ documents }) }; } },
    mailer: { getRemainingDailyQuota: () => quota, sendEmail: mail => { if (mail.to === failAt) throw new Error("falhou"); sent.push(mail); } },
  };
}

test("o dono envia um e-mail por pessoa, com o login conferido no Firestore", () => {
  const fake = deps();
  const result = handleInvite(request({ emails: ["Ana@gmail.com", "bia@gmail.com", "ana@gmail.com"] }), fake);
  assert.deepEqual(plain(result), { ok: true, sent: ["ana@gmail.com", "bia@gmail.com"] });
  assert.deepEqual(fake.sent.map(mail => mail.to), ["ana@gmail.com", "bia@gmail.com"]);
  assert.equal(fake.sent[0].name, "GDG Campinas");
  assert.match(fake.fetched[0].url, /documents\/moderators/);
  assert.equal(fake.fetched[0].options.headers.Authorization, "Bearer tok");
});

test("quem não é o dono (o banco recusa) não envia nada", () => {
  for (const status of [401, 403, 500]) {
    const fake = deps({ status });
    assert.equal(handleInvite(request(), fake).error, "not-owner");
    assert.equal(fake.sent.length, 0);
  }
});

test("só recebe quem está na lista de moderadores", () => {
  const fake = deps();
  assert.equal(handleInvite(request({ emails: ["estranho@gmail.com"] }), fake).error, "no-recipient");
  assert.deepEqual(plain(handleInvite(request({ emails: ["estranho@gmail.com", "bia@gmail.com"] }), fake).sent), ["bia@gmail.com"]);
  assert.equal(fake.sent.length, 1);
});

test("pedido fora do formato não chega nem a consultar o banco", () => {
  const bad = [null, {}, request({ idToken: "" }), request({ emails: [] }), request({ emails: "ana@gmail.com" }), request({ emails: Array(LIMITS.recipients + 1).fill("ana@gmail.com") }), request({ subject: "x".repeat(LIMITS.subject + 1) }), request({ body: "" })];
  for (const payload of bad) {
    const fake = deps();
    assert.equal(handleInvite(payload, fake).error, "invalid");
    assert.equal(fake.fetched.length, 0);
  }
});

test("sem cota do dia não envia; falha no meio devolve quem já recebeu", () => {
  const noQuota = deps({ quota: 1 });
  assert.equal(handleInvite(request({ emails: ["ana@gmail.com", "bia@gmail.com"] }), noQuota).error, "quota");
  assert.equal(noQuota.sent.length, 0);
  const broken = handleInvite(request({ emails: ["ana@gmail.com", "bia@gmail.com"] }), deps({ failAt: "bia@gmail.com" }));
  assert.deepEqual(plain(broken), { ok: false, error: "send-failed", sent: ["ana@gmail.com"] });
});
