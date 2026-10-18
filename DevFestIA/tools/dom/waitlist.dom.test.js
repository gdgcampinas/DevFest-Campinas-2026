/**
 * Testes da LISTA DE ESPERA dos ingressos (docs/js/features/waitlist.js, waitlist-rules.js, components/waitlist.js e o modo em features/tickets.js): validação do que a pessoa digita, o cartão e o formulário,
 * o envio (grava UM cadastro por aparelho), "você já está na lista", erro que não apaga o texto, botão que não envia duas vezes, e a virada do site pro "Avise-me quando abrir" (só em DEV até liberar).
 * Banco e login de mentira.
 *   node --test DevFestIA/tools/dom/waitlist.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadSite, SITE_BASE, waitFor, settle, textOf } = require("../lib/dom-harness.js");

const site = loadSite({
  scripts: [...SITE_BASE, "data/email-hash.js", "components/escape-html.js", "data/waitlist-config.js", "data/waitlist-texts.js", "features/waitlist-rules.js", "components/waitlist.js", "components/tickets-soon.js", "features/waitlist.js", "features/tickets.js"],
});
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("WAITLIST_CONFIG");
const text = g("WAITLIST_TEXTS");
const validate = entry => g("validateWaitlistEntry")(entry, config);

function mount({ enabled = true, has = false, addImpl, hasImpl, openAtStart = false, source = "home" } = {}) {
  document.body.innerHTML = `<section id="waitlist" hidden></section>`;
  const added = [];
  const repository = {
    has: hasImpl ?? (async () => has),
    add: addImpl ?? (async (uid, entryKey, data) => { added.push({ uid, entryKey, data }); }),
  };
  const root = document.getElementById("waitlist");
  const view = g("initWaitlist")(root, { enabled, repository, getUid: async () => "uid1", config, text, rules: { validateWaitlistEntry: g("validateWaitlistEntry") }, source, lang: "pt", contactEmail: "contato@gdg.test", openAtStart });
  const open = async () => { root.querySelector("[data-waitlist-open]").click(); await waitFor(() => root.querySelector("[data-waitlist-form]") || root.querySelector(".wl-result")); };
  const fill = (name, email) => { root.querySelector("[data-waitlist-name]").value = name; root.querySelector("[data-waitlist-email]").value = email; };
  const submit = () => root.querySelector("[data-waitlist-form]").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  return { root, view, added, open, fill, submit };
}

test("regras: nome sem espaço sobrando, e-mail em minúsculas, origem só se for conhecida; nome curto, e-mail sem formato e acima do limite são recusados com o campo certo", () => {
  assert.equal(JSON.stringify(validate({ name: "  Geovanna   Silva ", email: " Geovanna@Example.COM ", source: "home", lang: "pt" })), JSON.stringify({ name: "Geovanna Silva", email: "geovanna@example.com", source: "home", lang: "pt" }));
  assert.equal(JSON.stringify(validate({ name: "Ana", email: "ana@example.com", source: "desconhecida" })), JSON.stringify({ name: "Ana", email: "ana@example.com" }), "origem desconhecida não vai");
  const field = entry => { try { validate(entry); return null; } catch (error) { return error.field; } };
  assert.equal(field({ name: "A", email: "ana@example.com" }), "name");
  assert.equal(field({ name: "x".repeat(81), email: "ana@example.com" }), "name");
  assert.equal(field({ name: "Ana", email: "ana-sem-arroba" }), "email");
  assert.equal(field({ name: "Ana", email: "a@b" }), "email");
  assert.equal(field({ name: "Ana", email: "com espaco@example.com" }), "email");
  assert.equal(field({ name: "Ana", email: `${"a".repeat(120)}@example.com` }), "email");
  assert.equal(field({ name: "Ana", email: "ana@example.com" }), null);
});

test("exportação: sem repetidos (fica o cadastro mais antigo), do mais novo pro mais antigo, CSV com aspas e fórmulas neutralizadas, e-mails separados por vírgula", () => {
  const entries = [
    { name: "Ana", email: "ana@example.com", source: "home", lang: "pt", createdAtMs: 3000 },
    { name: "Ana (outro aparelho)", email: "ANA@example.com", source: "ingressos", createdAtMs: 5000 },
    { name: "=HYPERLINK(\"x\")", email: "beto@example.com", createdAtMs: 4000 },
    { name: "Carla \"C\"", email: "carla@example.com", createdAtMs: 1000 },
  ];
  assert.equal(JSON.stringify(g("dedupeWaitlist")(entries).map(entry => entry.email)), JSON.stringify(["beto@example.com", "ana@example.com", "carla@example.com"]));
  const csv = g("waitlistCsv")(entries, { formatDate: ms => `d${ms}` });
  assert.ok(csv.startsWith("﻿\"nome\",\"email\",\"origem\",\"idioma\",\"data\"\r\n"), "BOM e cabeçalho");
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")","beto@example.com","","","d4000"'), "fórmula neutralizada e aspas dobradas");
  assert.ok(csv.includes('"Carla ""C""","carla@example.com","","","d1000"'));
  assert.equal(csv.split("\r\n").filter(Boolean).length, 4, "cabeçalho mais 3 pessoas");
  assert.equal(g("waitlistEmails")(entries), "beto@example.com, ana@example.com, carla@example.com");
});

test("desligada: o cartão fica escondido e nada é lido nem gravado", () => {
  const { root, added } = mount({ enabled: false });
  assert.equal(root.hidden, true);
  assert.equal(root.innerHTML, "");
  assert.equal(added.length, 0);
});

test("cartão: badge, título, os 3 passos e o botão; o formulário só aparece ao tocar no botão", async () => {
  const { root, open } = mount();
  assert.equal(root.hidden, false);
  assert.match(textOf(root), /Ingressos em breve/);
  assert.match(textOf(root), /Os ingressos do DevFest Campinas abrem em breve/);
  assert.equal(root.querySelectorAll(".wl-step").length, 3);
  assert.equal(root.querySelector("[data-waitlist-form]"), null);
  await open();
  assert.ok(root.querySelector("[data-waitlist-form]"));
  assert.equal(root.querySelector(".wl-open").hidden, true, "o botão some quando o formulário abre");
  assert.match(textOf(root), /Usamos seu e-mail só para avisar do DevFest Campinas\. Você sai da lista quando quiser\./);
  assert.match(textOf(root), /Para sair da lista, escreva para contato@gdg\.test\./);
});

test("enviar: grava UM cadastro (nome e e-mail limpos, origem e idioma) com a chave interest e mostra 'Pronto, você está na lista'", async () => {
  const { root, open, fill, submit, added } = mount({ source: "ingressos" });
  await open();
  fill("  Geovanna  Silva ", "Geovanna@Example.com");
  submit();
  await waitFor(() => root.querySelector(".wl-result"));
  assert.equal(added.length, 1);
  assert.equal(added[0].uid, "uid1");
  assert.equal(added[0].entryKey, "interest");
  assert.equal(JSON.stringify(added[0].data), JSON.stringify({ name: "Geovanna Silva", email: "geovanna@example.com", source: "ingressos", lang: "pt" }));
  assert.match(textOf(root), /Pronto, você está na lista/);
  assert.equal(root.querySelector("[data-waitlist-form]"), null);
});

test("dado inválido: avisa no campo certo, mantém o que foi digitado e não grava", async () => {
  const { root, open, fill, submit, added } = mount();
  await open();
  fill("Ana", "ana-sem-arroba");
  submit();
  await settle();
  assert.match(textOf(root), /Confira o e-mail/);
  assert.equal(root.querySelector("[data-waitlist-email]").getAttribute("aria-invalid"), "true");
  assert.equal(root.querySelector("[data-waitlist-name]").value, "Ana");
  assert.equal(root.querySelector("[data-waitlist-email]").value, "ana-sem-arroba");
  fill("A", "ana@example.com");
  submit();
  await settle();
  assert.match(textOf(root), /Escreva seu nome/);
  assert.equal(added.length, 0);
});

test("o aparelho já está na lista: ao abrir mostra 'Você já está na lista' (sem formulário); se o banco recusa o 2º cadastro (permission-denied) também", async () => {
  const known = mount({ has: true });
  await known.open();
  assert.match(textOf(known.root), /Você já está na lista/);
  assert.equal(known.root.querySelector("[data-waitlist-form]"), null);
  const denied = mount({ addImpl: async () => { throw Object.assign(new Error("negado"), { code: "permission-denied" }); } });
  await denied.open();
  denied.fill("Ana", "ana@example.com");
  denied.submit();
  await waitFor(() => denied.root.querySelector(".wl-result"));
  assert.match(textOf(denied.root), /Você já está na lista/);
});

test("erro de rede: avisa, mantém o texto e deixa tentar de novo; o botão não envia duas vezes enquanto envia", async () => {
  let calls = 0;
  let release;
  const failing = mount({ addImpl: async () => { calls++; if (calls === 1) throw new Error("offline"); } });
  await failing.open();
  failing.fill("Ana", "ana@example.com");
  failing.submit();
  await waitFor(() => /Não deu para enviar/.test(textOf(failing.root)));
  assert.equal(failing.root.querySelector("[data-waitlist-name]").value, "Ana");
  failing.submit();
  await waitFor(() => failing.root.querySelector(".wl-result"));
  assert.equal(calls, 2);

  let slowCalls = 0;
  const slow = mount({ addImpl: () => new Promise(resolve => { slowCalls++; release = resolve; }) });
  await slow.open();
  slow.fill("Ana", "ana@example.com");
  slow.submit();
  slow.submit();
  await settle();
  assert.equal(slowCalls, 1, "duas tentativas seguidas gravam uma vez");
  release();
  await waitFor(() => slow.root.querySelector(".wl-result"));
});

test("o texto do dado nunca vira HTML e `openAtStart` já abre o formulário (ingressos.html#waitlist)", async () => {
  const injected = { ...text, title: "<img src=x onerror=alert(1)>", formTitle: "<b>x</b>" };
  document.body.innerHTML = `<section id="waitlist" hidden></section>`;
  g("initWaitlist")(document.getElementById("waitlist"), { enabled: true, repository: { has: async () => false, add: async () => {} }, getUid: async () => "u", config, text: injected, rules: { validateWaitlistEntry: g("validateWaitlistEntry") }, openAtStart: true });
  await waitFor(() => document.querySelector("[data-waitlist-form]"));
  assert.equal(document.querySelector("#waitlist img"), null);
  assert.equal(document.querySelector("#waitlist .wl-form-title b"), null);
  assert.match(document.querySelector(".wl-title").textContent, /<img/);
});

test("modo lista de espera dos ingressos: só em produção e só com `public`; ligado, tira o link de compra, desliga as vendas e o botão leva ao cartão; desligado não mexe em nada", () => {
  const tickets = () => ({ url: "https://sympla.test/x", label: "Garanta sua vaga", status: "Ingressos em breve", salesOpen: true, waitlist: { enabled: true, public: false } });
  const apply = g("applyWaitlistMode");
  const prod = tickets();
  assert.equal(apply(prod, { devMode: false }), false, "em produção, enquanto não for público");
  assert.equal(prod.salesOpen, true);
  assert.equal(prod.url, "https://sympla.test/x");
  assert.equal(g("ticketCtaState")(prod).kind, "buy");
  const dev = tickets();
  assert.equal(apply(dev, { devMode: true }), false, "em DEV os ingressos já estão abertos: sem lista de espera");
  assert.equal(dev.salesOpen, true);
  const live = { ...tickets(), waitlist: { enabled: true, public: true } };
  assert.equal(apply(live, { devMode: false }), true, "em produção (public) liga");
  assert.equal(live.salesOpen, false);
  assert.equal(live.url, "");
  const state = g("ticketCtaState")(live);
  assert.equal(state.kind, "waitlist-form");
  assert.equal(state.href, "ingressos.html#waitlist");
  assert.match(g("ticketButtonMarkup")(state, { place: "header" }), /<a class="cta" href="ingressos\.html#waitlist" data-track-event="cta_click"/);
  assert.doesNotMatch(g("ticketButtonMarkup")(state), /target="_blank"/, "o cartão é do próprio site: mesma aba");
  const off = { ...tickets(), waitlist: { enabled: false, public: true } };
  assert.equal(apply(off, { devMode: false }), false, "desligado não liga");
  assert.equal(apply({ url: "x" }, { devMode: true }), false, "sem a chave no dado nada acontece");
});

test("bloco 'ingressos em breve': aviso, cartões-fantasma bloqueados (sem nome nem valor), o botão leva ao #waitlist e o texto do dado é escapado", () => {
  const html = g("ticketsSoonMarkup")({ text: { ...text, soonTitle: "<i>x</i>" }, count: config.soonCards });
  const box = document.createElement("div");
  box.innerHTML = html;
  assert.equal(box.querySelectorAll(".wl-ghost").length, config.soonCards);
  assert.ok([...box.querySelectorAll(".wl-ghost")].every(card => card.getAttribute("aria-hidden") === "true"), "decoração: escondida do leitor de tela");
  assert.equal(box.querySelector(".wl-soon-title i"), null, "texto escapado");
  assert.match(textOf(box.querySelector(".wl-soon-body")), /Quem está na lista de espera sabe primeiro/);
  assert.equal(box.querySelector("a.cta").getAttribute("href"), "#waitlist");
  assert.doesNotMatch(textOf(box), /R\$|Grátis|VIP|camiseta/i, "nenhum tipo nem valor de ingresso aparece antes da revelação");
});

test("o botão do bloco (href #waitlist) abre o formulário sem recarregar a página; stop solta o ouvinte", async () => {
  const { root, view } = mount();
  assert.equal(root.querySelector("[data-waitlist-form]"), null);
  window.location.hash = "#waitlist";
  window.dispatchEvent(new window.Event("hashchange"));
  await waitFor(() => root.querySelector("[data-waitlist-form]"));
  view.stop();
});
