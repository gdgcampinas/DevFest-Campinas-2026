/**
 * Número que sobe até o valor final (cena de inscritos): `countUpValue` é a conta pura (curva que desacelera no fim) e `runCountUp` a anda no
 * `schedule` injetado, passo a passo, sem requestAnimationFrame (que não dispara em aba oculta). Pára sozinho ao chegar. Dual (navegador e Node).
 */
const easeOutCubic = progress => 1 - (1 - progress) ** 3;

function countUpValue(total, progress, ease = easeOutCubic) {
  return Math.round(total * ease(Math.min(1, Math.max(0, progress))));
}

/** Chama `onValue(n)` a cada `stepMs`, de 0 até `total` em `durationMs`; devolve a função que pára. */
function runCountUp({ schedule, total, durationMs, stepMs, onValue }) {
  let ticks = 0;
  let done = false;
  let stop = () => {};
  stop = scheduleEvery(schedule, stepMs, () => {
    if (done) return;
    const progress = durationMs > 0 ? Math.min(1, (ticks++ * stepMs) / durationMs) : 1; // duração 0 = já no total
    onValue(countUpValue(total, progress));
    if (progress >= 1) {
      done = true;
      Promise.resolve().then(() => stop()); // `stop` só existe depois do 1º passo, que roda na hora
    }
  });
  return () => { done = true; stop(); };
}

if (typeof module !== "undefined") module.exports = { easeOutCubic, countUpValue, runCountUp };
