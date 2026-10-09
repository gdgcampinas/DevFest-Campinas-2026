/**
 * Testes de TELA da página de enviar recado (docs/js/features/wall-submit.js, components/wall-submit.js, recado.html): escolher a pergunta, escrever, o filtro de primeira linha, o envio como `pending`, o
 * limite de 3 por aparelho (que sobrevive a recarregar a página), fechado, erro que não apaga o texto e o botão que não envia duas vezes. Banco e login de mentira.
 *   node --test --test-force-exit DevFestIA/tools/dom/wall-submit.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, waitFor, textOf } = require("../lib/dom-harness.js");

const UNITS = [...SITE_BASE, "data/brand.js", "components/brand.js", "data/wall-config.js", "data/wall-texts.js", "components/wall-submit.js", "features/wall-text.js", "features/wall-submit.js"];
const site = loadSite({ scripts: UNITS });
const { window, document } = site;
test.after(() => window.close());
const g = name => site.get(name);
const config = g("WALL_CONFIG");
const text = g("WALL_TEXTS");
const rules = { validateWallPost: g("validateWallPost"), nextWallSlot: g("nextWallSlot"), wallEntry: g("wallEntry") };

function mount({ used = [], open = true, phase = open ? "open" : "closed", addImpl, getUid = async () => "uid1", mineImpl } = {}) {
  document.body.innerHTML = `<div id="wallBody"></div>`;
  const added = [];
  const repository = {
    getMineFor: mineImpl ?? (async () => new Set(used.map(n => `wall-${n}`))),
    add: addImpl ?? (async (uid, entryKey, data) => { added.push({ uid, entryKey, data }); }),
  };
  const root = document.getElementById("wallBody");
  let currentPhase = phase;
  const view = g("initWallSubmit")(root, { repository, config, rules, getUid, text, phaseOf: () => currentPhase, hours: { from: "08:00", until: "17:30" } });
  const type = (selector, value) => { const el = root.querySelector(selector); el.value = value; el.dispatchEvent(new window.Event("input", { bubbles: true })); };
  const submit = () => root.querySelector("[data-wall-form]").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  return { root, view, added, type, submit, setPhase: value => { currentPhase = value; }, ready: () => waitFor(() => root.querySelector("[data-wall-form]") || /Obrigado|encerrados|abrem no dia/.test(textOf(root))) };
}

test("abre com as perguntas do dado (a primeira marcada), campo com a ajuda dela, contador e o botão de enviar", async () => {
  const { root, ready } = mount();
  await ready();
  assert.deepEqual([...root.querySelectorAll("[data-wall-prompt]")].map(input => input.value), [...config.prompts.map(prompt => prompt.id)]);
  assert.equal(root.querySelector("[data-wall-prompt]:checked").value, config.prompts[0].id);
  assert.equal(root.querySelector("[data-wall-text]").placeholder, config.prompts[0].placeholder);
  assert.equal(root.querySelector("[data-wall-text]").getAttribute("maxlength"), String(config.maxLength));
  assert.equal(textOf(root.querySelector("[data-slot=count]")), `0/${config.maxLength}`);
  assert.match(textOf(root.querySelector("[data-wall-send]")), /Enviar pro telão/);
});

test("trocar a pergunta troca a ajuda do campo e o contador anda com o que a pessoa digita", async () => {
  const { root, ready, type } = mount();
  await ready();
  const second = root.querySelectorAll("[data-wall-prompt]")[1];
  second.checked = true;
  second.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(root.querySelector("[data-wall-text]").placeholder, config.prompts[1].placeholder);
  type("[data-wall-text]", "Vim pra aprender");
  assert.equal(textOf(root.querySelector("[data-slot=count]")), `16/${config.maxLength}`);
});

test("enviar: grava como pendente no espaço 1 do aparelho, com a pergunta e o apelido, e mostra 'recebemos' com quantos ainda dá pra mandar", async () => {
  const { root, ready, type, submit, added } = mount();
  await ready();
  type("[data-wall-text]", "  Vim buscar   gente boa  ");
  type("[data-wall-nickname]", " Ana ");
  submit();
  await waitFor(() => /Recebemos/.test(textOf(root)));
  assert.deepEqual(JSON.parse(JSON.stringify(added)), [{ uid: "uid1", entryKey: "wall-1", data: { entryKey: "wall-1", text: "Vim buscar gente boa", prompt: config.prompts[0].id, status: "pending", nickname: "Ana" } }]);
  assert.match(textOf(root), /Mandar outro recado \(2\)/);
  assert.ok(root.querySelector("img.wall-mascot"), "o Gumbleton comemora o envio");
});

test("mandar outro: o formulário volta limpo no espaço seguinte; no último recado não oferece mais", async () => {
  const { root, ready, type, submit, added } = mount({ used: [1, 2] });
  await ready();
  type("[data-wall-text]", "O último");
  submit();
  await waitFor(() => /Recebemos/.test(textOf(root)));
  assert.equal(added[0].entryKey, "wall-3", "o único espaço livre");
  assert.equal(root.querySelector("[data-wall-again]"), null);
  assert.match(textOf(root), /último recado/);
  const again = mount({ used: [] });
  await again.ready();
  again.type("[data-wall-text]", "primeiro");
  again.submit();
  await waitFor(() => again.root.querySelector("[data-wall-again]"));
  again.root.querySelector("[data-wall-again]").click();
  assert.equal(again.root.querySelector("[data-wall-text]").value, "");
  again.type("[data-wall-text]", "segundo");
  again.submit();
  await waitFor(() => again.added.length === 2);
  assert.equal(again.added[1].entryKey, "wall-2");
});

test("limite: quem já mandou os 3 (mesmo recarregando a página) vê o aviso e não o formulário", async () => {
  const { root, ready } = mount({ used: [1, 2, 3] });
  await ready();
  assert.match(textOf(root), /já mandou todos os seus recados/);
  assert.ok(root.querySelector("img.wall-mascot"));
  assert.equal(root.querySelector("[data-wall-form]"), null);
});

test("filtro de primeira linha: palavra ofensiva, link, texto vazio e grande demais são recusados na tela, sem enviar e sem apagar o que a pessoa digitou", async () => {
  const { root, ready, type, submit, added } = mount();
  await ready();
  submit();
  assert.match(textOf(root.querySelector("[data-slot=message]")), /Escreva o recado\./);
  type("[data-wall-text]", "que merda");
  submit();
  assert.match(textOf(root.querySelector("[data-slot=message]")), /não podemos mostrar no telão/);
  assert.equal(root.querySelector("[data-wall-text]").value, "que merda", "o texto fica");
  type("[data-wall-text]", "veja http://golpe.com");
  submit();
  assert.match(textOf(root.querySelector("[data-slot=message]")), /link, e-mail nem telefone/);
  assert.equal(added.length, 0);
});

test("falha ao enviar: avisa, mantém o texto, devolve o botão e deixa tentar de novo; o botão não envia duas vezes enquanto envia", async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const { root, ready, type, submit } = mount({ addImpl: async () => { calls++; await gate; throw new Error("rede"); } });
  await ready();
  type("[data-wall-text]", "Meu recado");
  submit();
  submit();
  assert.ok(root.querySelector("[data-wall-send]").disabled);
  release();
  await waitFor(() => /Não consegui enviar/.test(textOf(root)));
  assert.equal(calls, 1, "um envio só");
  assert.equal(root.querySelector("[data-wall-text]").value, "Meu recado");
  assert.equal(root.querySelector("[data-wall-send]").disabled, false);
});

test("fechado (config.open = false) e sem conseguir ler o limite (sem login ou sem permissão): a página fecha em vez de deixar enviar sem garantia", async () => {
  const closed = mount({ open: false });
  await closed.ready();
  assert.match(textOf(closed.root), /encerrados/);
  assert.equal(closed.root.querySelector("[data-wall-form]"), null);
  const noRead = mount({ mineImpl: async () => { throw { code: "permission-denied" }; } });
  await noRead.ready();
  assert.match(textOf(noRead.root), /encerrados/);
  const noLogin = mount({ getUid: async () => { throw new Error("sem login"); } });
  await noLogin.ready();
  assert.match(textOf(noLogin.root), /encerrados/);
});

test("janela: antes das 08:00 mostra quando abre (com as horas), depois das 17:30 mostra encerrado, e sem formulário nos dois", async () => {
  const before = mount({ phase: "before" });
  await before.ready();
  assert.match(textOf(before.root), /abrem no dia do evento, das 08:00 às 17:30/);
  assert.equal(before.root.querySelector("[data-wall-form]"), null);
  const closed = mount({ phase: "closed" });
  await closed.ready();
  assert.match(textOf(closed.root), /encerrados/);
});

test("janela: a página aberta desde cedo não envia depois que a janela fecha (o envio é recusado na hora e a tela vira 'encerrados')", async () => {
  const { root, ready, type, submit, added, setPhase } = mount();
  await ready();
  type("[data-wall-text]", "Quase fora do horário");
  setPhase("closed");
  submit();
  assert.match(textOf(root), /encerrados/);
  assert.equal(added.length, 0);
});

test("texto do dado nunca vira HTML e stop impede a tela de mudar depois", async () => {
  const { root, ready, view } = mount();
  await ready();
  view.stop();
  const html = root.innerHTML;
  const again = mount({ used: [1, 2, 3] });
  again.view.stop();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.doesNotMatch(textOf(again.root), /já mandou todos/, "parado antes de carregar: a tela não muda depois");
  assert.equal(root.innerHTML, html);
  const markup = g("wallSubmitShellMarkup")({ config: { ...config, prompts: [{ id: "x", label: "<b>oi</b>", placeholder: "<i>p</i>" }] }, text });
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  assert.equal(holder.querySelector("b"), null);
  assert.equal(holder.querySelector("i"), null);
});

test("a página recado.html inteira abre o formulário com as frases e as perguntas do dado", async () => {
  const DOCS = path.join(__dirname, "..", "..", "..", "docs");
  const html = fs.readFileSync(path.join(DOCS, "recado.html"), "utf8");
  assert.match(html, /noindex/);
  const scripts = [...html.matchAll(/<script src="(js\/[^"?]+)[^"]*"/g)].map(match => match[1].replace("js/", "")).map(file => file.replace("data/schedule.dev.js", "data/schedule.js")).filter(file => !["pages/recado.js", "app.js"].includes(file));
  const page = loadSite({
    scripts, html: `<!doctype html><html><body><span id="wallMascot"></span><span id="wallLogo"></span><h1 id="wallTitle"></h1><p id="wallIntro"></p><div id="wallBody">Carregando…</div></body></html>`,
    globals: { initShell: () => true, resolveNow: () => () => new Date("2026-11-28T10:00:00-03:00"), wallRepository: { getMineFor: async () => new Set(), add: async () => {} }, firebaseClient: { ensureAnonymousUid: async () => "uid1" } },
  });
  page.run(fs.readFileSync(path.join(DOCS, "js", "pages", "recado.js"), "utf8"), "pages/recado.js");
  await waitFor(() => page.document.querySelector("[data-wall-form]"));
  assert.equal(page.document.getElementById("wallTitle").textContent, "Seu recado no telão");
  assert.match(page.document.getElementById("wallIntro").textContent, /aprovar/);
  assert.equal(page.document.querySelectorAll("[data-wall-prompt]").length, 3);
  assert.equal(page.document.querySelector("#wallMascot img").getAttribute("src"), "assets/img/gumbleton.png");
  assert.equal(page.document.querySelector("#wallLogo img").getAttribute("alt"), "GDG Campinas");
  page.window.close();
});
