/**
 * Testes da faixa com o nome no cartão "Eu vou!" (docs/js/features/share-card-art.js, data/share-card-design.js): desenha o nome em maiúsculas, diminui a fonte quando não cabe, e a arte existe.
 *   node --test --test-force-exit DevFestIA/tools/dom/share-card-art.dom.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { fitFontSize, drawNamePill } = require("../../../docs/js/features/share-card-art.js");

/** Contexto 2D de mentira: mede cada letra como 0,6 da fonte e guarda o que foi desenhado. */
function fakeCtx() {
  const calls = { text: [], fonts: [] };
  const ctx = {
    font: "", fillStyle: "", strokeStyle: "", lineWidth: 0, globalAlpha: 1, textAlign: "", textBaseline: "",
    save() {}, restore() {}, beginPath() {}, roundRect() {}, fill() {}, stroke() {}, arc() {},
    measureText: text => ({ width: text.length * parseInt(/(\d+)px/.exec(ctx.font)?.[1] ?? "10", 10) * 0.6 }),
    fillText: (text, x, y) => { calls.text.push({ text, x, y }); calls.fonts.push(ctx.font); },
  };
  return { ctx, calls };
}
const BOX = { x: 60, y: 790, height: 84, maxWidth: 560, fontSize: 42 };

test("a faixa desenha o texto recebido na posição da caixa", () => {
  const { ctx, calls } = fakeCtx();
  drawNamePill(ctx, { text: "DAYANE VAI!", box: BOX, font: "Google Sans", accent: "#00af57", bg: "#05060a" });
  assert.equal(calls.text.length, 1);
  assert.equal(calls.text[0].text, "DAYANE VAI!");
  assert.ok(calls.text[0].x > BOX.x && calls.text[0].y > BOX.y);
  assert.match(calls.fonts[0], /42px/);
});

test("nome comprido: a fonte diminui até caber na largura máxima", () => {
  const { ctx } = fakeCtx();
  const long = "MARIA DA CONCEIÇÃO DOS SANTOS DE OLIVEIRA VAI!";
  const size = fitFontSize(ctx, long, 400, { size: 42, family: "Google Sans" });
  assert.ok(size < 42 && size >= 22);
  assert.ok(ctx.measureText(long).width <= 400 || size === 22);
});

test("a arte pronta existe e o dado aponta pra ela", () => {
  const design = JSON.parse(JSON.stringify(require("vm").runInNewContext("(()=>{const createRepository=d=>d;" + fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "js", "data", "share-card-design.js"), "utf8").replace(/^const shareCardDesignRepository.*$/m, "") + "return SHARE_CARD_DESIGN})()")));
  assert.deepEqual(design.size, { width: 1080, height: 1350 });
  assert.ok(fs.existsSync(path.join(__dirname, "..", "..", "..", "docs", design.templates.default)));
});
