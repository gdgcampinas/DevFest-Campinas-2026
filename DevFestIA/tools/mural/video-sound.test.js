/**
 * Quando o vídeo do mural toca COM SOM (docs/js/features/video-sound.js): só nos momentos da grade e fases do evento que o dado permite.
 *   node --test DevFestIA/tools/mural/video-sound.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { videoSoundAllowed } = load("features/video-sound.js");

test("som por momento da grade (almoço) ou por fase do evento (antes e depois); fora disso e sem regra, mudo", () => {
  const rule = { moments: ["lunch", "closing"], phases: ["before", "after"] };
  assert.equal(videoSoundAllowed(rule, { moment: "lunch", phase: "live" }), true);
  assert.equal(videoSoundAllowed(rule, { moment: "closing", phase: "live" }), true);
  assert.equal(videoSoundAllowed(rule, { moment: null, phase: "before" }), true);
  assert.equal(videoSoundAllowed(rule, { moment: null, phase: "after" }), true);
  assert.equal(videoSoundAllowed(rule, { moment: null, phase: "live" }), false, "entre palestras: mudo");
  assert.equal(videoSoundAllowed(rule, { moment: "opening", phase: "live" }), false);
  assert.equal(videoSoundAllowed(undefined, { moment: "lunch", phase: "after" }), false);
  assert.equal(videoSoundAllowed({}, { moment: "lunch", phase: "after" }), false, "regra vazia: mudo");
  assert.equal(videoSoundAllowed({ moments: ["lunch"] }, { moment: "lunch", phase: "live" }), true, "só momentos, sem fases");
});
