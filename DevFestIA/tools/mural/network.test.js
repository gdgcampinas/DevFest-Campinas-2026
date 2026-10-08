/**
 * Rede do mural (docs/js/features/mural-network.js), espera crescente, escuta resiliente do ao vivo, versão e utilitários: queda e volta
 * da internet, escuta que cai ou fica muda, versão nova publicada.
 *   node --test DevFestIA/tools/mural/network.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load, backoffDelay } = require("./load.js");
const { createFakeClock } = require("../lib/fake-clock.js");
const { createNetworkMonitor, createFetchProbe } = load("features/mural-network.js");
const { createResilientListener, createLiveHub } = load("features/mural-live.js");
const { pollOpen, documentListenOpen, buildLiveSources } = load("features/mural-live-sources.js");
const { assetSignature, createVersionChecker } = load("features/mural-version.js");
const { defaultSchedule, withTimeout } = load("features/scheduler.js");
const { createFreshPublishDetector } = load("features/publish-detector.js");

const backoff = { baseMs: 1000, maxMs: 8000, factor: 2 };
const fakeWindow = () => {
  const handlers = {};
  return { addEventListener: (name, fn) => (handlers[name] = fn), removeEventListener: name => delete handlers[name], fire: name => handlers[name]?.() };
};

test("espera crescente: dobra a cada tentativa e respeita o teto", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(n => backoffDelay(n, backoff)), [1000, 2000, 4000, 8000, 8000, 8000]);
  assert.equal(backoffDelay(0, { ...backoff, jitter: 0.5 }, () => 1), 500);
});

test("withTimeout: resolve, rejeita e estoura o prazo", async () => {
  const clock = createFakeClock();
  assert.equal(await withTimeout(Promise.resolve(7), 1000, clock.schedule), 7);
  await assert.rejects(withTimeout(Promise.reject(new Error("falhou")), 1000, clock.schedule), /falhou/);
  let outcome = null;
  withTimeout(new Promise(() => {}), 1000, clock.schedule, "estourou").catch(error => (outcome = error.message));
  await clock.tick(999);
  assert.equal(outcome, null);
  await clock.tick(2);
  assert.equal(outcome, "estourou");
  assert.equal(clock.pending(), 0, "nenhum timer sobrando");
});

test("rede: sonda detecta queda e volta, mede a duração e avisa só nas mudanças", async () => {
  const clock = createFakeClock();
  let internet = true;
  const changes = [];
  const monitor = createNetworkMonitor({ win: fakeWindow(), probe: async () => internet, nowMs: clock.nowMs, schedule: clock.schedule, config: { probeEveryMs: 30000, backoff }, onChange: state => changes.push({ ...state }) });
  await monitor.start();
  assert.equal(monitor.state().online, true);
  assert.equal(changes.length, 0, "começa online, sem aviso");

  internet = false;
  await clock.tick(30000);
  assert.equal(monitor.state().online, false);
  assert.equal(changes.length, 1);
  await clock.tick(60000); // continua fora: sonda com espera crescente, sem avisar de novo
  assert.equal(changes.length, 1);

  internet = true;
  await clock.tick(60000);
  assert.equal(monitor.state().online, true);
  assert.equal(changes.length, 2);
  assert.ok(monitor.state().lastOutageMs >= 60000, "duração da queda registrada");
  monitor.stop();
});

test("rede: o evento 'offline' do navegador derruba na hora; o 'online' só vale depois da sonda confirmar", async () => {
  const clock = createFakeClock();
  const win = fakeWindow();
  let internet = true;
  const monitor = createNetworkMonitor({ win, probe: async () => internet, nowMs: clock.nowMs, schedule: clock.schedule, config: { probeEveryMs: 30000, backoff } });
  await monitor.start();
  internet = false;
  win.fire("offline");
  assert.equal(monitor.state().online, false);
  win.fire("online"); // Wi-Fi voltou mas sem internet de verdade
  await clock.tick(0);
  assert.equal(monitor.state().online, false);
  internet = true;
  win.fire("online");
  await clock.tick(0);
  assert.equal(monitor.state().online, true);
  monitor.stop();
});

test("rede: sonda que lança erro conta como fora; sonda por fetch respeita o tempo limite", async () => {
  const clock = createFakeClock();
  const monitor = createNetworkMonitor({ win: fakeWindow(), probe: async () => { throw new Error("boom"); }, nowMs: clock.nowMs, schedule: clock.schedule, config: { probeEveryMs: 1000, backoff } });
  await monitor.start();
  assert.equal(monitor.state().online, false);
  monitor.stop();

  const hanging = createFetchProbe({ fetchFn: (url, { signal }) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(new Error("abort")))), url: "https://x/204", timeoutMs: 5000, schedule: clock.schedule });
  let result = null;
  hanging().then(value => (result = value));
  await clock.tick(5001);
  assert.equal(result, false);
  const fine = createFetchProbe({ fetchFn: async () => ({}), url: "https://x/204", timeoutMs: 5000, schedule: clock.schedule });
  assert.equal(await fine(), true);
});

test("escuta resiliente: erro reabre com espera crescente e volta a receber", async () => {
  const clock = createFakeClock();
  const opens = [];
  const received = [];
  const listener = createResilientListener({
    open: (onData, onError) => { opens.push({ onData, onError }); return () => {}; },
    onData: value => received.push(value), schedule: clock.schedule, nowMs: clock.nowMs, backoff,
  });
  listener.start();
  await clock.tick(0);
  opens[0].onData("a");
  opens[0].onError(new Error("caiu"));
  await clock.tick(999);
  assert.equal(opens.length, 1, "ainda esperando a 1ª espera (1 s)");
  await clock.tick(1);
  assert.equal(opens.length, 2);
  opens[1].onError(new Error("caiu de novo"));
  await clock.tick(1999);
  assert.equal(opens.length, 2, "2ª espera é de 2 s");
  await clock.tick(1);
  assert.equal(opens.length, 3);
  opens[2].onData("b");
  assert.deepEqual(received, ["a", "b"]);
  opens[2].onError(new Error("x"));
  await clock.tick(1000);
  assert.equal(opens.length, 4, "depois de receber dado a espera recomeça em 1 s");
  listener.stop();
});

test("escuta resiliente: callbacks atrasados da escuta antiga são ignorados e o stop da antiga é chamado", async () => {
  const clock = createFakeClock();
  const opens = [];
  const stops = [];
  const received = [];
  const listener = createResilientListener({
    open: (onData, onError) => { opens.push({ onData, onError }); return () => stops.push(opens.length); },
    onData: value => received.push(value), schedule: clock.schedule, nowMs: clock.nowMs, backoff,
  });
  listener.start();
  await clock.tick(0);
  opens[0].onError(new Error("caiu"));
  assert.deepEqual(stops, [1]);
  opens[0].onData("velho"); // chegou tarde
  assert.deepEqual(received, []);
  listener.stop();
});

test("escuta resiliente: fonte muda além do silêncio é reaberta; reconnect() reabre já e zera a espera", async () => {
  const clock = createFakeClock();
  const opens = [];
  const listener = createResilientListener({
    open: onData => { opens.push(onData); return () => {}; },
    onData: () => {}, schedule: clock.schedule, nowMs: clock.nowMs, backoff, silenceMs: 10000,
  });
  listener.start();
  await clock.tick(0);
  opens[0]("dado");
  await clock.tick(10001);
  await clock.tick(1000);
  assert.equal(opens.length, 2, "ficou muda por 10 s: reabriu");
  listener.reconnect();
  await clock.tick(0);
  assert.equal(opens.length, 3);
  listener.stop();
  await clock.tick(100000);
  assert.equal(opens.length, 3, "parado não reabre");
});

test("escuta resiliente: open que rejeita (login falhou) também tenta de novo", async () => {
  const clock = createFakeClock();
  let calls = 0;
  const listener = createResilientListener({
    open: async () => { if (++calls < 3) throw new Error("sem login"); return () => {}; },
    onData: () => {}, schedule: clock.schedule, nowMs: clock.nowMs, backoff,
  });
  listener.start();
  await clock.tick(10000);
  assert.equal(calls, 3);
  listener.stop();
});

test("hub: guarda o último valor, avisa a mudança com o anterior e reconecta tudo", async () => {
  const clock = createFakeClock();
  const feeds = {};
  const updates = [];
  const hub = createLiveHub({
    sources: [
      { id: "registered", open: onData => { feeds.registered = onData; return () => {}; } },
      { id: "off", enabled: false, open: () => assert.fail("fonte desligada não abre") },
    ],
    schedule: clock.schedule, nowMs: clock.nowMs, backoff, onUpdate: (id, value, previous) => updates.push([id, value, previous]),
  });
  hub.start();
  await clock.tick(0);
  feeds.registered({ total: 10 });
  feeds.registered({ total: 12 });
  assert.deepEqual(hub.get("registered"), { total: 12 });
  assert.deepEqual(updates[1], ["registered", { total: 12 }, { total: 10 }]);
  assert.equal(hub.status("registered").state, "live");
  hub.stop();
});

test("fonte por polling: lê já e de tempos em tempos; erro vira onError e pára de ler", async () => {
  const clock = createFakeClock();
  let reads = 0;
  let failNext = false;
  const errors = [];
  const values = [];
  const open = pollOpen({ read: async () => { if (failNext) throw new Error("sem rede"); return ++reads; }, intervalMs: 1000, schedule: clock.schedule });
  const stop = open(value => values.push(value), error => errors.push(error.message));
  await clock.tick(2500);
  assert.deepEqual(values, [1, 2, 3]);
  failNext = true;
  await clock.tick(1000);
  assert.deepEqual(errors, ["sem rede"]);
  const before = values.length;
  await clock.tick(5000);
  assert.equal(values.length, before, "depois do erro não lê mais (o hub reabre com espera)");
  stop();
});

test("fontes montadas pelo dado: uma escuta por chave, repositories e chaves resolvidos por nome, login antes de escutar", async () => {
  const clock = createFakeClock();
  const listened = [];
  const order = [];
  const sources = buildLiveSources({
    definitions: [
      { id: "podium", kind: "document", repository: "results", keys: "contest-sessions" },
      { id: "registered", kind: "poll", repository: "stats", key: "2026", intervalMs: 1000, enabled: false },
    ],
    repositories: { results: () => ({ listen: (key, onData) => { listened.push(key); order.push("listen"); return () => {}; } }), stats: () => ({ get: async () => ({ total: 1 }) }) },
    keyResolvers: { "contest-sessions": () => ["k1", "k2"] },
    getUid: async () => { order.push("login"); },
    schedule: clock.schedule,
  });
  assert.deepEqual(sources.map(s => s.id), ["podium:k1", "podium:k2", "registered"]);
  assert.equal(sources[2].enabled, false);
  await sources[0].open(() => {}, () => {});
  assert.deepEqual(order, ["login", "listen"]);
  assert.deepEqual(listened, ["k1"]);
  assert.equal(typeof documentListenOpen, "function");
});

test("fontes por álbum: cada chave pode ter o seu intervalo de leitura", async () => {
  const clock = createFakeClock();
  const reads = [];
  const sources = buildLiveSources({
    definitions: [{ id: "album", kind: "poll", repository: "albums", keys: "albums", intervalMs: 600000 }],
    repositories: { albums: () => ({ get: async key => { reads.push(key); return { key }; } }) },
    keyResolvers: { albums: () => [{ key: "ao-vivo", intervalMs: 45000 }, { key: "antigo" }] },
    schedule: clock.schedule,
  });
  assert.deepEqual(sources.map(source => source.id), ["album:ao-vivo", "album:antigo"]);
  sources.forEach(source => source.open(() => {}, () => {}));
  await clock.tick(100000);
  assert.equal(reads.filter(key => key === "ao-vivo").length, 3, "lê já, aos 45 s e aos 90 s");
  assert.equal(reads.filter(key => key === "antigo").length, 1, "o antigo usa os 10 min do padrão");
});

test("versão: a assinatura muda quando um ?v=N muda; a primeira leitura é a base; falha de rede não é mudança", async () => {
  const html = n => `<script src="js/a.js?v=${n}"></script><link href="css/b.css?v=2"><script src="js/fixo.js"></script>`;
  assert.equal(assetSignature(html(1)), "css/b.css?v=2|js/a.js?v=1");
  assert.notEqual(assetSignature(html(1)), assetSignature(html(2)));
  assert.equal(assetSignature(`onerror="document.write('<script src=&quot;js/data/schedule.js?v=24&quot;>')"`), "js/data/schedule.js?v=24");

  const changes = [];
  let page = html(1);
  let offline = false;
  const checker = createVersionChecker({ fetchText: async () => { if (offline) throw new Error("sem rede"); return page; }, onChange: signature => changes.push(signature) });
  await checker.check();
  await checker.check();
  assert.equal(changes.length, 0);
  offline = true;
  page = html(2);
  await checker.check();
  assert.equal(changes.length, 0, "sem rede não conclui nada");
  offline = false;
  await checker.check();
  assert.equal(changes.length, 1);
});

test("detector de publicação: só comemora quando viu vazio e depois encheu", () => {
  const detector = createFreshPublishDetector();
  assert.equal(detector.observe(null), false);
  assert.equal(detector.observe([]), false);
  assert.equal(detector.observe([{ place: 1 }]), true, "publicado ao vivo");
  assert.equal(detector.observe([{ place: 1 }, { place: 2 }]), false, "mais um lugar não é nova publicação");

  const reopened = createFreshPublishDetector();
  assert.equal(reopened.observe([{ place: 1 }]), false, "tela aberta com o pódio já publicado não comemora");
  detector.reset();
  assert.equal(detector.observe([{ place: 1 }]), false);
});

test("agendador padrão devolve um cancelador", async () => {
  let ran = false;
  const cancel = defaultSchedule(() => (ran = true), 5);
  cancel();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(ran, false);
});
