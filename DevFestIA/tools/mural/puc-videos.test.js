/**
 * Dados dos vídeos da PUC-Campinas no telão (data/puc-videos.js, mural-videos.js, mural-scenes.js, mural-captions.js): toda cena aponta pra uma lista que existe, todo clipe da lista tem legenda registrada,
 * e a liberação é UMA chave só (`PUC_VIDEO_CONFIG.public`): as cenas dos vídeos ligam juntas e a cena `apoio` simples sai no lugar da `apoio-video`.
 *   node --test DevFestIA/tools/mural/puc-videos.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const readData = file => fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "js", "data", file), "utf8");
function loadAll(publicFlag) {
  const context = vm.createContext({ createRepository: (data, extra = {}) => ({ getAll: () => data, ...extra }), WALLPAPERS_CONFIG: { public: true }, VENUE_PHOTOS_CONFIG: { public: true }, EVENT: { tickets: { showCounter: false, counterMin: 0 } }, WALL_CONFIG: { open: false, window: { from: null, until: null } } });
  const source = ["puc-videos.js", "mural-videos.js", "mural-captions.js", "mural-scenes.js"].map(readData).join("\n;\n").replace(/^  public: (true|false),/m, `  public: ${publicFlag},`);
  vm.runInContext(`${source}\n;globalThis.__out = { PUC_VIDEO_CONFIG, MURAL_VIDEO_CLIPS, MURAL_VIDEO_PLAYLISTS, MURAL_CAPTIONS, MURAL_SCENES, muralVideosRepository };`, context);
  return context.__out;
}
const pucScenes = scenes => scenes.filter(scene => /^video-puc-|^apoio-video$/.test(scene.id));

test("cada cena da PUC toca uma lista que existe, e todo clipe da lista existe e tem legenda registrada", () => {
  const { MURAL_VIDEO_CLIPS, MURAL_VIDEO_PLAYLISTS, MURAL_CAPTIONS, MURAL_SCENES } = loadAll(false);
  const lists = pucScenes(MURAL_SCENES).map(scene => scene.params.playlist ?? scene.params.backdrop?.playlist);
  assert.deepEqual([...lists].sort(), ["puc-campus", "puc-completo", "puc-fechamento", "puc-fundo", "puc-resumo"]);
  for (const name of lists) {
    assert.ok(MURAL_VIDEO_PLAYLISTS[name], `lista ${name}`);
    for (const id of MURAL_VIDEO_PLAYLISTS[name].clips) {
      assert.ok(MURAL_VIDEO_CLIPS.some(clip => clip.id === id), `clipe ${id}`);
      assert.ok(MURAL_CAPTIONS[id], `legenda de ${id}`);
    }
  }
});

test("liberação por uma chave só: desligada, as cenas da PUC saem e a `apoio` simples fica; ligada, entram juntas e a `apoio` simples sai", () => {
  for (const flag of [false, true]) {
    const { MURAL_SCENES } = loadAll(flag);
    assert.ok(pucScenes(MURAL_SCENES).length >= 5);
    assert.ok(pucScenes(MURAL_SCENES).every(scene => scene.enabled === flag), `public: ${flag}`);
    assert.equal(MURAL_SCENES.find(scene => scene.id === "apoio").enabled, !flag);
  }
});

test("só a `apoio-video` leva fundo animado, e o laço usa o clipe sem etiqueta; os dois cortes longos entram só no almoço e no encerramento", () => {
  const { MURAL_SCENES, MURAL_VIDEO_CLIPS } = loadAll(true);
  assert.deepEqual([...MURAL_SCENES.filter(scene => scene.params.backdrop).map(scene => scene.id)], ["apoio-video"]);
  assert.equal(MURAL_VIDEO_CLIPS.find(clip => clip.id === "puc-fundo").label, "");
  for (const id of ["video-puc-fechamento", "video-puc-completo"]) assert.deepEqual([...MURAL_SCENES.find(scene => scene.id === id).requires.moments], ["lunch", "closing"]);
});

test("o telão só baixa os arquivos das listas das cenas ligadas: desligados, os vídeos da PUC não gastam a rede", () => {
  const { muralVideosRepository } = loadAll(false);
  assert.deepEqual([...muralVideosRepository.filesFor(["bosch"])], ["bosch-institucional.mp4"]);
  assert.deepEqual([...muralVideosRepository.filesFor(["puc-resumo", "puc-resumo", "puc-fundo", "nao-existe"])], ["puc-resumo.mp4", "puc-fundo.mp4"], "sem repetir e ignorando lista que não existe");
  assert.deepEqual([...muralVideosRepository.filesFor([])], []);
});

test("os vídeos da PUC aparecem inteiros em qualquer proporção (a marca d'água dela fica no canto e o `cover` a cortava); só o fundo animado usa `cover`", () => {
  const { MURAL_VIDEO_CLIPS } = loadAll(true);
  for (const clip of MURAL_VIDEO_CLIPS.filter(item => item.id.startsWith("puc-"))) assert.equal(clip.fit, clip.id === "puc-fundo" ? "cover" : "contain", clip.id);
});
