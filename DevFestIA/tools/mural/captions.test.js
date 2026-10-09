/**
 * Legendas do telão (docs/js/features/mural-captions.js e data/mural-captions.js): a frase certa em cada segundo do clipe e os dados de legenda coerentes com os clipes.
 *   node --test DevFestIA/tools/mural/captions.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { load } = require("./load.js");
const { captionAt } = load("features/mural-captions.js");

const cues = [{ from: 1, to: 3, text: "primeira" }, { from: 3, to: 5, text: "segunda" }, { from: 6, to: 7, text: "terceira" }];

test("a frase vale de `from` (inclusive) até `to` (exclusivo); no vão e fora do clipe a legenda some", () => {
  const at = seconds => captionAt(cues, seconds);
  assert.deepEqual([0, 0.99, 1, 2.99, 3, 4.5, 5, 5.5, 6, 6.99, 7, 99].map(at), ["", "", "primeira", "primeira", "segunda", "segunda", "", "", "terceira", "terceira", "", ""]);
  assert.equal(captionAt([], 2), "");
});

function loadData(file, globals = {}) {
  const context = vm.createContext({ createRepository: (data, extra = {}) => ({ getAll: () => data, ...extra }), ...globals });
  const source = fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "js", "data", file), "utf8");
  vm.runInContext(`${source}\n;globalThis.__out = { ${file.includes("captions") ? "MURAL_CAPTIONS, muralCaptionsRepository" : "MURAL_VIDEO_CLIPS"} };`, context);
  return context.__out;
}

test("os dados de legenda: todo clipe do telão tem entrada, as frases cabem no clipe, em ordem, sem sobrepor e curtas o bastante pra caber em 2 linhas", () => {
  const { MURAL_CAPTIONS, muralCaptionsRepository } = loadData("mural-captions.js");
  const { MURAL_VIDEO_CLIPS } = loadData("mural-videos.js", { VIDEO_FIT: {} });
  for (const clip of MURAL_VIDEO_CLIPS) {
    const entry = MURAL_CAPTIONS[clip.id];
    assert.ok(entry, `${clip.id}: sem entrada de legenda (use cues: [] se o clipe não tem fala)`);
    let last = 0;
    for (const cue of entry.cues) {
      assert.ok(cue.from >= last - 0.001, `${clip.id}: frase fora de ordem ou sobreposta em ${cue.from}`);
      assert.ok(cue.to > cue.from, `${clip.id}: frase com fim antes do começo`);
      assert.ok(cue.to <= clip.seconds + 0.5, `${clip.id}: frase passa do fim do clipe (${cue.to} > ${clip.seconds})`);
      assert.ok(cue.text.length >= 3 && cue.text.length <= 110, `${clip.id}: frase com ${cue.text.length} caracteres`);
      last = cue.to;
    }
  }
  assert.deepEqual([...muralCaptionsRepository.cuesFor("devfest-2025-chegada")], [], "clipe com legenda gravada não leva a nossa");
  assert.equal(muralCaptionsRepository.cuesFor("nao-existe").length, 0);
  assert.ok(muralCaptionsRepository.cuesFor("devfest-2025-palco").length > 0);
});
