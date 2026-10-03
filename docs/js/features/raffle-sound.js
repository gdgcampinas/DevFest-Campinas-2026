/**
 * Toca os sons do sorteio (data/raffle-sound.js) com o Web Audio. O `ctx` (AudioContext) é injetado por quem chama
 * (nos testes, um de mentira): este arquivo não cria contexto nem lê relógio. DUAL: as contas puras
 * (`soundDuration`) são testadas em Node.
 */

/** Duração total de uma lista de notas, em segundos (quando a última termina). */
function soundDuration(notes) {
  return notes.reduce((end, item) => Math.max(end, item.at + item.dur), 0);
}

/** Toca as notas a partir de `startAt`: cada uma com ataque rápido e queda suave (sem estalo no começo nem no fim). */
function playTones(ctx, notes, startAt = ctx.currentTime) {
  for (const item of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const begin = startAt + item.at;
    const end = begin + item.dur;
    osc.type = item.type;
    osc.frequency.value = item.freq;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ctx.destination);
    osc.start(begin);
    gain.gain.linearRampToValueAtTime(item.gain, begin + Math.min(0.015, item.dur / 3));
    gain.gain.exponentialRampToValueAtTime(0.0005, end);
    osc.stop(end + 0.03);
  }
}

/** Tique da roleta girando. */
const playRaffleTick = (ctx, sound) => playTones(ctx, [sound.tick]);

/** Fanfarra da revelação do ganhador (junto com o papel picado). */
const playRaffleFanfare = (ctx, sound) => playTones(ctx, sound.fanfare);

if (typeof module !== "undefined") module.exports = { soundDuration, playTones, playRaffleTick, playRaffleFanfare };
