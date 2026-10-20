/**
 * Disparo do sync do Sympla pelo Worker (sync-trigger.mjs e sync-handler.mjs): chama o GitHub certo, respeita a espera mínima, o cron ignora a espera, sem token não faz nada e nunca devolve o token.
 *   node --test DevFestIA/tools/album-proxy/sync-trigger.test.mjs
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createSyncTrigger } from "./sync-trigger.mjs";
import { createSyncHandler } from "./sync-handler.mjs";
import { createWorkerStore } from "./worker.mjs";

const ORIGIN = "https://gdgcampinas.github.io";
function setup({ token = "ghp_SEGREDO", status = 204, cooldownMs = 120000 } = {}) {
  let time = 1_000_000;
  const calls = [];
  const fetchFn = async (url, init) => { calls.push({ url, init }); if (status === "throw") throw new Error("rede"); return { status }; };
  const trigger = createSyncTrigger({ fetchFn, token, repo: "org/repo", workflow: "sync-sympla.yml", now: () => time, cooldownMs });
  return { trigger, calls, advance: ms => (time += ms) };
}

test("dispara o workflow certo no GitHub, com o token e o ref", async () => {
  const { trigger, calls } = setup();
  assert.deepEqual(await trigger.trigger(), { status: "started" });
  assert.equal(calls[0].url, "https://api.github.com/repos/org/repo/actions/workflows/sync-sympla.yml/dispatches");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.authorization, "Bearer ghp_SEGREDO");
  assert.deepEqual(JSON.parse(calls[0].init.body), { ref: "main" });
});

test("espera mínima entre disparos; depois dela dispara de novo; o cron (force) ignora a espera", async () => {
  const { trigger, calls, advance } = setup();
  await trigger.trigger();
  advance(30000);
  assert.deepEqual(await trigger.trigger(), { status: "cooldown", retryInMs: 90000 });
  assert.equal(calls.length, 1);
  assert.equal((await trigger.trigger({ force: true })).status, "started");
  advance(120000);
  assert.equal((await trigger.trigger()).status, "started");
  assert.equal(calls.length, 3);
});

test("sem token não faz nada; erro do GitHub ou da rede vira status de erro", async () => {
  assert.deepEqual(await setup({ token: "" }).trigger.trigger(), { status: "disabled" });
  assert.deepEqual(await setup({ status: 403 }).trigger.trigger(), { status: "error", httpStatus: 403 });
  assert.deepEqual(await setup({ status: "throw" }).trigger.trigger(), { status: "error" });
});

test("HTTP: 202, 429, 503 e 502; CORS só pro site; só POST; nunca devolve o token", async () => {
  const run = async (options, request) => createSyncHandler({ trigger: setup(options).trigger, allowedOrigins: [ORIGIN] })(request);
  const post = origin => new Request("https://w/sync", { method: "POST", headers: origin ? { origin } : {} });
  const ok = await run({}, post(ORIGIN));
  assert.equal(ok.status, 202);
  assert.equal(ok.headers.get("access-control-allow-origin"), ORIGIN);
  assert.deepEqual(await ok.json(), { status: "started" });
  assert.equal((await run({}, post("https://outro.site"))).headers.get("access-control-allow-origin"), null);
  assert.equal((await run({ token: "" }, post())).status, 503);
  assert.equal((await run({ status: 500 }, post())).status, 502);
  assert.equal((await run({}, new Request("https://w/sync", { method: "GET" }))).status, 405);
  assert.equal((await run({}, new Request("https://w/sync", { method: "OPTIONS", headers: { origin: ORIGIN } }))).status, 204);
  const trigger = setup().trigger;
  const handler = createSyncHandler({ trigger, allowedOrigins: [ORIGIN] });
  await handler(post());
  const second = await handler(post());
  assert.equal(second.status, 429);
  assert.doesNotMatch(JSON.stringify(await second.json()), /ghp_|SEGREDO|Bearer/);
});

test("a guarda do horário usa o cache da borda (entre instâncias)", async () => {
  const cache = new Map();
  const storage = { match: async request => cache.get(request.url) ?? null, put: async (request, response) => void cache.set(request.url, response) };
  const store = createWorkerStore(storage);
  assert.equal(await store.get("last"), null);
  await store.set("last", 1234);
  assert.equal(await store.get("last"), 1234);
});
