/**
 * Testa o selo redondo de aniversário do telão (components/anniversary-seal.js, features/anniversary-seal.js): as cores do Google, os números e anos, a regra de onde NÃO aparece
 * (vídeo e emergência), a animação de entrada a cada volta e a liberação (nasce desligado, ensaio por `?selo=1`).
 *   node --test --test-force-exit DevFestIA/tools/dom/anniversary-seal.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, SITE_BASE, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const site = loadSite({ scripts: [...SITE_BASE, "components/escape-html.js", "data/anniversary.js", "features/anniversary.js", "components/anniversary-seal.js", "features/anniversary-seal.js"] });
const { document } = site;
test.after(() => site.window.close());
const g = name => site.get(name);
const config = g("anniversaryConfigRepository").getAll();
const text = g("anniversaryTextsRepository").getAll();
const released = { ...config, telaoSeal: { ...config.telaoSeal, public: true } };
const mount = () => { const el = document.createElement("div"); el.hidden = true; document.body.append(el); return el; };

test("o selo traz o número de anos, as faixas, o rótulo pra leitor de tela e as quatro cores do Google", () => {
  const el = mount();
  el.innerHTML = g("anniversarySealMarkup")({ years: { devfest: 10 }, firstDevFest: 2016, eventYear: 2026, text: text.seal });
  const svg = el.querySelector("svg");
  assert.equal(svg.getAttribute("aria-label"), "10 anos de DevFest em Campinas");
  const labels = Array.from(el.querySelectorAll("text"), node => textOf(node));
  assert.ok(labels.includes("DEVFEST CAMPINAS") && labels.includes("2016 · 2026") && labels.includes("10") && labels.includes("ANOS"));
  ["#4285f4", "#ea4335", "#fbbc04", "#34a853"].forEach(color => assert.ok(el.innerHTML.includes(color), color));
  assert.equal(el.querySelectorAll("ellipse").length, 8, "dois ramos de quatro folhas");
  assert.ok(el.querySelector(".seal-shine"), "o reflexo que passa");
});

test("o texto e os anos entram escapados", () => {
  const el = mount();
  el.innerHTML = g("anniversarySealMarkup")({ years: { devfest: "<b>1</b>" }, firstDevFest: "<i>", eventYear: 2026, text: { top: "<script>x</script>", unit: "A", label: "{devfest}" } });
  assert.equal(el.querySelectorAll("script, b, i").length, 0, "nada virou elemento");
  assert.equal(textOf(el.querySelector("text")), "<script>x</script>", "o texto vale literal");
});

test("a regra: com `public` ligado aparece em toda cena, menos nas de vídeo e na emergência; desligado nunca aparece", () => {
  const visible = g("sealVisibleFor");
  const off = { ...config, telaoSeal: { ...config.telaoSeal, public: false } };
  assert.equal(config.telaoSeal.public, true, "liberado em produção");
  assert.equal(visible(off, { id: "agora", type: "now-next" }), false, "com a chave desligada só o ensaio mostra");
  assert.equal(visible(released, { id: "agora", type: "now-next" }), true);
  ["historia-marco", "patrocinio-master", "selfie", "reserva"].forEach(id => assert.equal(visible(released, { id, type: "history" }), true, id));
  assert.equal(visible(released, { id: "video-bosch", type: "video" }), false, "vídeo: nunca");
  assert.equal(visible(released, { id: "video-2025-intervalo", type: "video" }), false);
  assert.equal(visible(released, { id: "emergencia", type: "emergency" }), false, "emergência: some");
  assert.equal(visible(released, null), false);
});

test("nas cenas de QR code o selo vai pro canto ESQUERDO (nunca cobre o QR) e volta pra direita nas outras; entra de novo ao trocar de lado", () => {
  const side = g("sealSideFor");
  assert.deepEqual(Array.from(config.telaoSeal.leftOnTypes), ["qr"]);
  ["qr-avaliar", "qr-recados", "qr-comunidade"].forEach(id => assert.equal(side(released, { id, type: "qr" }), "left", id));
  ["agora", "historia-marco", "fundos-1", "tips"].forEach((id, index) => assert.equal(side(released, { id, type: ["now-next", "history", "wallpapers", "tips"][index] }), "right", id));
  const el = mount();
  const seal = g("initAnniversarySeal")(el, { config: released, text, eventYear: 2026 });
  seal.show({ id: "agora", type: "now-next" });
  assert.equal(el.dataset.side, "right");
  assert.equal(el.parentElement.hasAttribute("data-seal-left"), false);
  el.classList.remove("is-in");
  seal.show({ id: "qr-avaliar", type: "qr" });
  assert.equal(el.dataset.side, "left");
  assert.equal(el.parentElement.hasAttribute("data-seal-left"), true, "o palco libera o outro canto pros cabeçalhos");
  assert.ok(el.classList.contains("is-in"), "trocou de lado: entra de novo");
  seal.show({ id: "agora", type: "now-next" });
  assert.equal(el.dataset.side, "right");
  assert.equal(el.parentElement.hasAttribute("data-seal-left"), false);
  const css = fs.readFileSync(path.join(DOCS, "css/mural.css"), "utf8");
  assert.match(css, /\.mural-seal\[data-side="left"\]\{right:auto;left:var\(--m\)\}/);
});

test("o selo aparece e some conforme a cena, e ENTRA de novo (animação) a cada volta; ano zero não mostra nada", () => {
  const el = mount();
  const seal = g("initAnniversarySeal")(el, { config: released, text, eventYear: 2026 });
  assert.ok(el.querySelector("svg"));
  assert.equal(seal.show({ id: "agora", type: "now-next" }), true);
  assert.equal(el.hidden, false);
  assert.ok(el.classList.contains("is-in"), "entra com a animação");
  assert.equal(el.parentElement.hasAttribute("data-seal"), true, "o palco sabe que o selo está lá");
  assert.equal(seal.show({ id: "video-bosch", type: "video" }), false);
  assert.equal(el.hidden, true, "some no vídeo");
  assert.equal(el.parentElement.hasAttribute("data-seal"), false);
  el.classList.remove("is-in");
  assert.equal(seal.show({ id: "agora", type: "now-next" }), true);
  assert.ok(el.classList.contains("is-in"), "voltou do vídeo: entra de novo");
  el.classList.remove("is-in");
  seal.show({ id: "tips", type: "tips" });
  assert.ok(!el.classList.contains("is-in"), "de uma cena com selo pra outra ele fica parado, sem reanimar");
  assert.equal(seal.show({ id: "emergencia", type: "emergency" }), false);
  const off = mount();
  assert.equal(g("initAnniversarySeal")(off, { config: { ...config, telaoSeal: { ...config.telaoSeal, public: false } }, text, eventYear: 2026 }).show({ id: "agora", type: "now-next" }), false, "desligado: nada");
  assert.equal(off.innerHTML, "");
  const early = mount();
  assert.equal(g("initAnniversarySeal")(early, { config: released, text, eventYear: 2016 }).show({ id: "agora", type: "now-next" }), false, "em 2016 o DevFest tem 0 anos");
});

test("o telão carrega o selo e o liga: elemento, scripts na ordem, `?selo=1` de ensaio e o some-no-vídeo pelo motor", () => {
  const telao = fs.readFileSync(path.join(DOCS, "telao.html"), "utf8");
  assert.match(telao, /id="muralSeal" hidden/);
  ["features/anniversary.js", "components/anniversary-seal.js", "features/anniversary-seal.js", "pages/mural.js"].forEach(file => assert.ok(telao.includes(`js/${file}`), file));
  assert.ok(telao.indexOf("components/anniversary-seal.js") < telao.indexOf("features/anniversary-seal.js"));
  const mural = fs.readFileSync(path.join(DOCS, "js/pages/mural.js"), "utf8");
  assert.match(mural, /initAnniversarySeal\(document\.getElementById\("muralSeal"\)/);
  assert.match(mural, /params\.get\("selo"\) === "1"/);
  assert.match(mural, /onSceneChange: \(\{ scene \}\) => \{[^}]*seal\.show\(scene\)/);
  const css = fs.readFileSync(path.join(DOCS, "css/mural.css"), "utf8");
  assert.match(css, /\.mural-seal\.is-in\{animation:ms-seal-in/);
  assert.match(css, /@keyframes ms-seal-shine/);
  assert.match(css, /\.mural-stage\[data-seal\]:not\(\[data-seal-left\]\) :is\(\.ms-head,\.ms-history-top\)\{padding-right:/, "os cabeçalhos deixam o canto livre");
});
