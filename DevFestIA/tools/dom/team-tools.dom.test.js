/**
 * Teste de TELA do painel da equipe (docs/equipe.html + js/pages/equipe.js): carrega os scripts do próprio equipe.html (então confere a lista de scripts da página) e vê os atalhos das ferramentas
 * internas, com um link por trilha nas que são por trilha.
 *   node --test DevFestIA/tools/dom/team-tools.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadSite, textOf } = require("../lib/dom-harness.js");

const DOCS = path.join(__dirname, "..", "..", "..", "docs");
const HTML = fs.readFileSync(path.join(DOCS, "equipe.html"), "utf8");
const SCRIPTS = [...HTML.matchAll(/<script src="(js\/[^"?]+)[^"]*"/g)].map(match => match[1].replace("js/", "").replace("data/schedule.dev.js", "data/schedule.js")).filter(file => file !== "pages/equipe.js");
const PAGE = fs.readFileSync(path.join(DOCS, "js", "pages", "equipe.js"), "utf8");

function boot() {
  const site = loadSite({ scripts: SCRIPTS, html: `<!doctype html><html><body><main id="teamBody">Carregando…</main></body></html>`, url: "http://localhost/equipe.html" });
  site.run(PAGE, "pages/equipe.js");
  return site;
}

test("painel da equipe: um cartão por ferramenta, com o texto do dado e o endereço certo", () => {
  const site = boot();
  const cards = [...site.document.querySelectorAll(".tt-card")];
  assert.deepEqual(cards.map(card => card.dataset.tool), ["mural", "mural-controle", "mural-fotos", "moderacao", "quadro", "sorteio"]);
  assert.match(textOf(site.document.getElementById("teamBody")), /Painel da equipe/);
  const mural = cards[0];
  assert.match(textOf(mural), /Mural do telão/);
  assert.equal(mural.querySelector("a").getAttribute("href"), "mural.html");
  assert.equal(cards[2].querySelector("a").getAttribute("href"), "mural-fotos.html?album=ao-vivo");
  assert.equal(cards[1].querySelector("a").getAttribute("href"), "mural-controle.html");
  site.window.close();
});

test("ferramentas por trilha (perguntas, quadro da sala): um link por trilha, com o id na URL e a cor da trilha", () => {
  const site = boot();
  const tracks = site.get("TRACKS");
  for (const tool of ["moderacao", "quadro"]) {
    const links = [...site.document.querySelectorAll(`[data-tool="${tool}"] a`)];
    assert.equal(links.length, tracks.length, `${tool}: um por trilha`);
    const base = tool === "moderacao" ? "moderacao.html" : "checkin-display.html";
    assert.deepEqual(links.map(link => link.getAttribute("href")), [...tracks].map(track => `${base}?trilha=${track.id}`));
    assert.equal(links[0].getAttribute("style"), `--track-color:${tracks[0].color}`);
  }
  site.window.close();
});

test("o texto do dado é escapado (nada vira HTML)", () => {
  const site = boot();
  const markup = site.get("teamToolsMarkup")({ tools: [{ id: "x", title: "<b>oi</b>", description: "a & b", href: "x.html?a=1&b=2" }], tracks: [] });
  const holder = site.document.createElement("div");
  holder.innerHTML = markup;
  assert.equal(holder.querySelector("b"), null);
  assert.match(textOf(holder), /<b>oi<\/b>/);
  assert.equal(holder.querySelector(".tt-card a").getAttribute("href"), "x.html?a=1&b=2");
  site.window.close();
});
