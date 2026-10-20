/**
 * Testes do "acabei de comprar" (docs/js/features/registration-sync.js, registration-gate.js, components/registration-gate.js, registrationGateOn de features/tickets.js): pede o sync na hora, consulta de
 * novo até achar ou acabar o tempo, o cartão mostra "confirmando…" e libera quando acha.
 *   node --test --test-force-exit DevFestIA/tools/dom/registration-sync.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, textOf, settle } = require("../lib/dom-harness.js");
const { createRegistrationSync } = require("../../../docs/js/features/registration-sync.js");

const site = loadSite({ scripts: [...SITE_BASE, "components/registration-gate.js", "features/registration-gate.js", "features/tickets.js"] });
test.after(() => site.window.close());
const g = name => site.get(name);

function fakeTime() {
  let time = 0;
  return { now: () => time, wait: async ms => { time += ms; } };
}

test("confirm: pede o sync e consulta de novo até achar", async () => {
  const requests = [];
  const clock = fakeTime();
  let checks = 0;
  const sync = createRegistrationSync({ syncUrl: "https://w/sync", fetchFn: async (url, init) => { requests.push([url, init.method]); return { ok: true }; }, ...clock, waitMs: 90000, pollMs: 6000 });
  assert.equal(await sync.confirm(async () => ++checks >= 3), true);
  assert.deepEqual(requests, [["https://w/sync", "POST"]]);
  assert.equal(checks, 3);
});

test("confirm: desiste depois do tempo e devolve false; rede fora do ar não quebra", async () => {
  const clock = fakeTime();
  let checks = 0;
  const sync = createRegistrationSync({ syncUrl: "https://w/sync", fetchFn: async () => { throw new Error("rede"); }, ...clock, waitMs: 30000, pollMs: 10000 });
  assert.equal(await sync.confirm(async () => { checks++; return false; }), false);
  assert.equal(checks, 3);
  assert.equal(await createRegistrationSync({ syncUrl: "", ...clock }).requestSync(), false, "sem endereço não pede nada");
});

function mountGate({ records = {}, sync = null }) {
  const container = site.document.createElement("div");
  site.document.body.appendChild(container);
  const added = [];
  const gate = g("createRegistrationGate")({ getRegistrations: () => ({ get: async key => records[key] ?? null }), edition: "2026", verifiedRepository: { count: () => added.length, addAll: keys => added.push(...keys) }, toKey: async (edition, email) => `${edition}_${email}`, sync });
  const verified = [];
  gate.mount(container, { onVerified: result => verified.push(result), ticketButtonHtml: "<a class='buy'>Comprar</a>" });
  const submit = email => { container.querySelector("[name=email]").value = email; container.querySelector("form").dispatchEvent(new site.window.Event("submit", { bubbles: true, cancelable: true })); };
  return { container, verified, submit };
}

test("cartão: e-mail já inscrito libera na hora, sem pedir sync", async () => {
  let asked = 0;
  const { verified, submit } = mountGate({ records: { "2026_a@x.com": { ticketName: "Grátis" } }, sync: { confirm: async () => { asked++; return false; } } });
  submit("a@x.com");
  await settle();
  assert.equal(verified.length, 1);
  assert.equal(asked, 0);
});

test("cartão: e-mail ainda não achado mostra 'confirmando', pede o sync e libera quando aparece", async () => {
  const records = {};
  let phaseSeen = "";
  const holder = {};
  const sync = { confirm: async check => { phaseSeen = textOf(holder.container); records["2026_novo@x.com"] = { ticketName: "Grátis" }; return check(); } };
  const mounted = mountGate({ records, sync });
  holder.container = mounted.container;
  mounted.submit("novo@x.com");
  await settle();
  assert.match(phaseSeen, /confirmando sua inscrição/);
  assert.equal(mounted.verified.length, 1);
});

test("cartão: se nem o sync achar, volta pro 'não encontramos' com o botão de comprar", async () => {
  const { container, verified, submit } = mountGate({ sync: { confirm: async () => false } });
  submit("intruso@x.com");
  await settle();
  assert.equal(verified.length, 0);
  assert.match(textOf(container), /Não encontramos inscrição/);
  assert.ok(container.querySelector(".buy"));
});

test("registrationGateOn: boolean antigo, ou { enabled, public } (só em DEV até liberar)", () => {
  const on = g("registrationGateOn");
  assert.equal(on({ registrationGate: false }), false);
  assert.equal(on({ registrationGate: true }), true);
  assert.equal(on({}), false);
  assert.equal(on({ registrationGate: { enabled: true, public: false } }, { devMode: false }), false);
  assert.equal(on({ registrationGate: { enabled: true, public: false } }, { devMode: true }), true);
  assert.equal(on({ registrationGate: { enabled: true, public: true } }, { devMode: false }), true);
  assert.equal(on({ registrationGate: { enabled: false, public: true } }, { devMode: true }), false);
});
