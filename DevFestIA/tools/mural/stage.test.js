/**
 * Palco do mural (docs/js/features/mural-stage.js): simulação de telão por ?tela= e ?proporcao=, tamanho/escala em várias janelas
 * e a forma (data-shape) que o CSS usa pra trocar o desenho.
 *   node --test DevFestIA/tools/mural/stage.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { parseStageSpec, computeStage, shapeOf } = load("features/mural-stage.js");

const shapes = [{ id: "ultrawide", minRatio: 2.4 }, { id: "wide", minRatio: 1.5 }, { id: "standard", minRatio: 1.1 }, { id: "tall", minRatio: 0 }];

test("sem parâmetro: o palco ocupa a janela (é o telão de verdade)", () => {
  assert.deepEqual(parseStageSpec("", { safeMarginPct: 2 }), { mode: "fill", safeMarginPct: 2 });
  const box = computeStage({ viewport: { width: 1920, height: 1080 }, spec: parseStageSpec(""), shapes });
  assert.deepEqual([box.width, box.height, box.scale, box.framed, box.shape], [1920, 1080, 1, false, "wide"]);
});

test("?tela=LxA: palco com exatamente essa resolução, reduzido pra caber na janela, centralizado e com moldura", () => {
  const spec = parseStageSpec("?tela=1920x1080");
  assert.equal(spec.mode, "size");
  const box = computeStage({ viewport: { width: 1000, height: 800 }, spec, shapes });
  assert.deepEqual([box.width, box.height], [1920, 1080]);
  assert.ok(Math.abs(box.scale - (1000 * 0.94) / 1920) < 1e-9);
  assert.equal(box.framed, true);
  assert.ok(box.left + (box.width * box.scale) / 2 - 500 < 1, "centralizado na horizontal");
});

test("?proporcao=3:1 (ou 3x1, ou 2.4:1): o maior palco dessa proporção que cabe, sem escala", () => {
  const spec = parseStageSpec("?proporcao=3:1");
  const wideWindow = computeStage({ viewport: { width: 1600, height: 900 }, spec, shapes });
  assert.equal(Math.round(wideWindow.width / wideWindow.height * 100) / 100, 3);
  assert.ok(wideWindow.width <= 1600 && wideWindow.height <= 900);
  assert.equal(wideWindow.shape, "ultrawide");
  assert.equal(parseStageSpec("?proporcao=3x1").ratio, 3);
  assert.equal(parseStageSpec("?proporcao=2.4:1").ratio, 2.4);
  const tallWindow = computeStage({ viewport: { width: 500, height: 1200 }, spec, shapes });
  assert.ok(tallWindow.width <= 500, "janela alta: a largura manda");
});

test("parâmetros inválidos caem em tela cheia em vez de quebrar", () => {
  ["?tela=abc", "?tela=10x10", "?proporcao=0:1", "?proporcao=x", "?tela="].forEach(search => assert.equal(parseStageSpec(search).mode, "fill", search));
});

test("margem segura: parâmetro vence o padrão; valores absurdos são ignorados", () => {
  assert.equal(parseStageSpec("?margem=4", { safeMarginPct: 2 }).safeMarginPct, 4);
  assert.equal(parseStageSpec("?margem=0", { safeMarginPct: 2 }).safeMarginPct, 0);
  assert.equal(parseStageSpec("?margem=90", { safeMarginPct: 2 }).safeMarginPct, 2);
  assert.equal(parseStageSpec("?margem=-1", { safeMarginPct: 2 }).safeMarginPct, 2);
});

test("a forma do palco vem só da proporção", () => {
  const shape = ratio => shapeOf(ratio, shapes);
  assert.deepEqual([3, 16 / 9, 4 / 3, 1, 9 / 16].map(shape), ["ultrawide", "wide", "standard", "tall", "tall"]);
  assert.equal(shape(2.4), "ultrawide");
});

test("tela vertical e quadrada também são tratadas (telão de LED pode ser qualquer coisa)", () => {
  const vertical = computeStage({ viewport: { width: 1080, height: 1920 }, spec: parseStageSpec(""), shapes });
  assert.equal(vertical.shape, "tall");
  const square = computeStage({ viewport: { width: 1000, height: 1000 }, spec: parseStageSpec("?tela=1024x1024"), shapes });
  assert.equal(square.shape, "tall");
});
