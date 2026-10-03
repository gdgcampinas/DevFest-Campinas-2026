/**
 * Testes do som do sorteio: a fanfarra (data/raffle-sound.js) é segura e bem formada, e o tocador
 * (features/raffle-sound.js) agenda as notas certas num AudioContext de mentira.
 *   node --test DevFestIA/tools/raffle/raffle-sound.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { soundDuration, playTones, playRaffleTick, playRaffleFanfare } = require("../../../docs/js/features/raffle-sound.js");

const read = file => fs.readFileSync(path.join(__dirname, "..", "..", "..", "docs", "js", file), "utf8");
const { RAFFLE_SOUND: sound } = vm.runInNewContext(`${read("data/repository.js")}\n${read("data/raffle-sound.js")}\n({ RAFFLE_SOUND })`);

/** AudioContext de mentira que registra o que foi criado e agendado. */
function fakeContext() {
  const log = { oscillators: [] };
  const ctx = {
    currentTime: 10,
    destination: {},
    createGain() { return { gain: { value: 0, ramps: [], linearRampToValueAtTime(v, t) { this.ramps.push(["linear", v, t]); }, exponentialRampToValueAtTime(v, t) { this.ramps.push(["exp", v, t]); } }, connect: node => node }; },
    createOscillator() {
      const osc = { type: "", frequency: { value: 0 }, started: null, stopped: null, connect: node => node, start(t) { osc.started = t; }, stop(t) { osc.stopped = t; } };
      log.oscillators.push(osc);
      return osc;
    },
  };
  return { ctx, log };
}

test("fanfarra: curta (até ~2,5 s), em ordem de entrada e com notas válidas", () => {
  assert.ok(sound.fanfare.length >= 10);
  assert.ok(soundDuration(sound.fanfare) <= 2.5, `dura ${soundDuration(sound.fanfare)}s`);
  assert.ok(soundDuration(sound.fanfare) >= 1.2, "tem corpo, não é só um plim");
  for (const note of sound.fanfare) {
    assert.ok(note.freq >= 100 && note.freq <= 5000, `frequência ${note.freq}`);
    assert.ok(note.dur > 0 && note.at >= 0);
    assert.ok(["sine", "square", "triangle", "sawtooth"].includes(note.type));
    assert.ok(note.gain > 0 && note.gain <= 0.1, `volume individual ${note.gain}`);
  }
});

test("fanfarra: a soma dos volumes das notas que tocam juntas não estoura (< 0,35)", () => {
  const moments = sound.fanfare.map(n => n.at + 0.001);
  moments.forEach(time => {
    const together = sound.fanfare.filter(n => n.at <= time && time < n.at + n.dur).reduce((sum, n) => sum + n.gain, 0);
    assert.ok(together < 0.35, `${together.toFixed(2)} em ${time.toFixed(2)}s`);
  });
});

test("fanfarra: termina num acorde de dó maior (dó, mi, sol juntos)", () => {
  const chord = sound.fanfare.filter(n => n.at === 0.78 && n.type === "triangle").map(n => Math.round(n.freq));
  assert.deepEqual(JSON.parse(JSON.stringify(chord.sort((a, b) => a - b))), [523, 659, 784, 1047]);
});

test("tocador: uma oscilador por nota, agendado a partir do relógio, com ataque e queda sem estalo", () => {
  const { ctx, log } = fakeContext();
  playRaffleFanfare(ctx, sound);
  assert.equal(log.oscillators.length, sound.fanfare.length);
  log.oscillators.forEach((osc, index) => {
    const note = sound.fanfare[index];
    assert.equal(osc.type, note.type);
    assert.equal(osc.frequency.value, note.freq);
    assert.ok(Math.abs(osc.started - (10 + note.at)) < 1e-9);
    assert.ok(osc.stopped > osc.started + note.dur - 1e-9, "para depois da nota acabar");
  });
});

test("tique da roleta: uma nota só", () => {
  const { ctx, log } = fakeContext();
  playRaffleTick(ctx, sound);
  assert.equal(log.oscillators.length, 1);
  assert.equal(log.oscillators[0].frequency.value, sound.tick.freq);
});

test("duração: a da lista vazia é zero e a do último que acaba conta", () => {
  assert.equal(soundDuration([]), 0);
  assert.equal(soundDuration([{ at: 0, dur: 1 }, { at: 0.5, dur: 2 }]), 2.5);
});

test("playTones aceita um início explícito", () => {
  const { ctx, log } = fakeContext();
  playTones(ctx, [{ at: 0.5, freq: 440, dur: 0.2, type: "sine", gain: 0.05 }], 3);
  assert.equal(log.oscillators[0].started, 3.5);
});
