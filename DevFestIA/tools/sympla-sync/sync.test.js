const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { registrationKey } = require("../../../docs/js/data/email-hash.js");
const { buildDesiredRegistrations, diffRegistrations, buildStats } = require("./reconcile.js");
const { runSync } = require("./sync-use-case.js");
const { createSymplaRepository } = require("./sympla-repository.js");
const { createFirestoreRestRepository, encodeFields, decodeFields } = require("../lib/firestore-rest.js");
const { createServiceAccountAuth } = require("../lib/google-auth.js");

const APPROVED = ["APPROVED"];
const person = (email, ticketName, orderId, orderStatus = "APPROVED", checkedIn = false) => ({ email, ticketName, orderId, orderStatus, checkedIn, customForm: [] });

test("só pedidos aprovados viram inscrição, com e-mail do participante e do comprador", async () => {
  const desired = await buildDesiredRegistrations({
    edition: "2026",
    approvedStatuses: APPROVED,
    participants: [person("Ana@x.com", "Grátis", "o1"), person("bia@x.com", "VIP", "o1"), person("cancelada@x.com", "Grátis", "o2", "CANCELLED")],
    orders: [{ id: "o1", buyerEmail: "compradora@x.com", status: "APPROVED" }, { id: "o2", buyerEmail: "cancelada-buyer@x.com", status: "CANCELLED" }],
  });
  assert.equal(desired.size, 3);
  assert.equal(desired.get(await registrationKey("2026", "ana@x.com")), "Grátis");
  assert.equal(desired.get(await registrationKey("2026", "COMPRADORA@x.com")), "Grátis");
  assert.equal(desired.has(await registrationKey("2026", "cancelada@x.com")), false);
});

test("e-mail do participante tem prioridade sobre o do comprador quando colidem", async () => {
  const desired = await buildDesiredRegistrations({
    edition: "2026", approvedStatuses: APPROVED,
    participants: [person("mesmo@x.com", "VIP", "o1"), person("outro@x.com", "Grátis", "o1")],
    orders: [{ id: "o1", buyerEmail: "mesmo@x.com", status: "APPROVED" }],
  });
  assert.equal(desired.get(await registrationKey("2026", "mesmo@x.com")), "VIP");
});

test("diff só grava o que mudou e apaga quem saiu", () => {
  const { upserts, deletes } = diffRegistrations({ a: "Grátis", b: "VIP", c: "Grátis" }, new Map([["a", "Grátis"], ["b", "Camiseta"], ["d", "Grátis"]]));
  assert.deepEqual(upserts, [["b", "Camiseta"], ["d", "Grátis"]]);
  assert.deepEqual(deletes, ["c"]);
});

test("estatísticas contam aprovados, check-in e respostas do formulário", () => {
  const withForm = { ...person("a@x.com", "VIP", "o1", "APPROVED", true), customForm: [{ name: "Camiseta", value: "M" }] };
  const stats = buildStats([withForm, person("b@x.com", "Grátis", "o2", "CANCELLED")], APPROVED);
  assert.deepEqual(stats, { total: 1, byTicket: { VIP: 1 }, checkedIn: 1, notApproved: 1, formAnswers: { "Camiseta: M": 1 } });
});

function fakeDatabase(initial = {}) {
  const docs = new Map(Object.entries(initial));
  const commits = [];
  return {
    docs, commits,
    getDocument: async (collection, id) => docs.get(`${collection}/${id}`) ?? null,
    commit: async writes => {
      commits.push(writes);
      writes.forEach(write => (write.remove ? docs.delete(write.remove.join("/")) : docs.set(`${write.set[0]}/${write.set[1]}`, write.set[2])));
    },
  };
}
const fakeSympla = (participants, orders = []) => ({ listParticipants: async () => participants, listOrders: async () => orders });

test("sync: primeira rodada grava tudo, segunda não grava nada, cancelamento remove", async () => {
  const database = fakeDatabase();
  const base = { database, edition: "2026", approvedStatuses: APPROVED };

  const first = await runSync({ ...base, symplaRepository: fakeSympla([person("a@x.com", "Grátis", "o1"), person("b@x.com", "VIP", "o2")]) });
  assert.equal(first.upserted, 2);
  assert.equal(database.docs.get("event-stats/2026").total, 2);
  assert.ok(database.docs.get("sync-state/2026").stateJson);

  const commitsBefore = database.commits.length;
  const second = await runSync({ ...base, symplaRepository: fakeSympla([person("a@x.com", "Grátis", "o1"), person("b@x.com", "VIP", "o2")]) });
  assert.equal(second.upserted + second.deleted, 0);
  assert.equal(database.commits.length, commitsBefore, "sem mudança não pode gravar nada");

  const third = await runSync({ ...base, symplaRepository: fakeSympla([person("a@x.com", "Grátis", "o1"), person("b@x.com", "VIP", "o2", "CANCELLED")]) });
  assert.equal(third.deleted, 1);
  assert.equal(database.docs.get("event-stats/2026").total, 1);
});

test("sync em modo teste não grava nada", async () => {
  const database = fakeDatabase();
  const result = await runSync({ database, edition: "2026", dryRun: true, symplaRepository: fakeSympla([person("a@x.com", "Grátis", "o1")]) });
  assert.equal(result.upserted, 1);
  assert.equal(database.commits.length, 0);
});

const jsonResponse = body => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });

test("repository do Sympla pagina participantes por página e pedidos por cursor", async () => {
  const urls = [];
  const fetchFn = async url => {
    urls.push(url);
    if (url.includes("/participants")) {
      const page = Number(new URL(url).searchParams.get("page"));
      return jsonResponse({ data: [{ email: `p${page}@x.com`, ticket_name: "Grátis", order_id: "o", order_status: "APPROVED", checkin: { check_in: page === 1 } }], pagination: { has_next: page < 2, total_page: 2 } });
    }
    const cursor = new URL(url).searchParams.get("cursor");
    return jsonResponse(cursor ? { data: [{ id: "o2", buyer_email: "b@x.com", order_status: "APPROVED" }], pagination: {} } : { data: [{ id: "o1", buyer_email: "a@x.com", order_status: "APPROVED" }], pagination: { next_cursor: "c2" } });
  };
  const repository = createSymplaRepository({ token: "t", eventIdHash: "ev", fetchFn });
  const participants = await repository.listParticipants();
  const orders = await repository.listOrders();
  assert.deepEqual(participants.map(p => [p.email, p.checkedIn]), [["p1@x.com", true], ["p2@x.com", false]]);
  assert.deepEqual(orders.map(o => o.id), ["o1", "o2"]);
  assert.ok(urls.every(url => url.includes("/events/ev/")));
});

test("repository do Sympla nunca entra em laço infinito", async () => {
  const fetchFn = async () => jsonResponse({ data: [], pagination: { has_next: true } });
  await assert.rejects(createSymplaRepository({ token: "t", eventIdHash: "ev", fetchFn }).listParticipants(), /abortando/);
});

test("firestore-rest: encode/decode de campos e lotes de escrita", async () => {
  const data = { edition: "2026", total: 7, ratio: 0.5, ok: true, list: ["a"], nested: { x: 1 } };
  assert.deepEqual(decodeFields(encodeFields(data)), data);

  const bodies = [];
  const fetchFn = async (url, options) => { bodies.push(JSON.parse(options.body)); return jsonResponse({}); };
  const database = createFirestoreRestRepository({ projectId: "p", auth: { getAccessToken: async () => "tok" }, fetchFn });
  await database.commit(Array.from({ length: 450 }, (_, index) => ({ set: ["registrations", `k${index}`, { edition: "2026" }] })));
  assert.deepEqual(bodies.map(body => body.writes.length), [400, 50]);
  assert.equal(bodies[0].writes[0].updateTransforms[0].setToServerValue, "REQUEST_TIME");
});

test("google-auth: assina JWT RS256 verificável e reaproveita o token em cache", async () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  let calls = 0;
  let assertion = "";
  const fetchFn = async (url, options) => { calls += 1; assertion = options.body.get("assertion"); return jsonResponse({ access_token: "abc", expires_in: 3600 }); };
  const auth = createServiceAccountAuth({
    serviceAccount: { client_email: "sa@p.iam", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) },
    scope: "scope-x", fetchFn, nowFn: () => 1_000_000,
  });
  assert.equal(await auth.getAccessToken(), "abc");
  assert.equal(await auth.getAccessToken(), "abc");
  assert.equal(calls, 1);
  const [header, claims, signature] = assertion.split(".");
  assert.equal(JSON.parse(Buffer.from(claims, "base64url")).iss, "sa@p.iam");
  assert.ok(crypto.createVerify("RSA-SHA256").update(`${header}.${claims}`).verify(publicKey, signature, "base64url"));
});
