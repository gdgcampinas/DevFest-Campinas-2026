/**
 * Relógio falso para os testes do mural: `schedule(fn, ms)` e `nowMs()` no mesmo padrão que o site injeta (features/scheduler.js), mas o
 * tempo só anda quando o teste manda (`await clock.tick(ms)`). Dá pra simular horas de telão em milissegundos, na ordem certa e
 * deixando as promises pendentes resolverem entre um timer e outro.
 */
function createFakeClock(start = 1_700_000_000_000) {
  let time = start;
  let sequence = 0;
  const timers = new Map();

  const settle = () => new Promise(resolve => setImmediate(resolve));

  return {
    nowMs: () => time,
    schedule(fn, ms) {
      const id = ++sequence;
      timers.set(id, { id, at: time + Math.max(0, ms), fn });
      return () => timers.delete(id);
    },
    pending: () => timers.size,
    /** Anda `ms` disparando os timers vencidos em ordem; cada um roda com o relógio no seu horário. */
    async tick(ms = 0) {
      const target = time + ms;
      await settle();
      for (;;) {
        const due = [...timers.values()].filter(timer => timer.at <= target).sort((a, b) => a.at - b.at || a.id - b.id)[0];
        if (!due) break;
        timers.delete(due.id);
        time = due.at;
        due.fn();
        await settle();
      }
      time = target;
      await settle();
    },
  };
}

module.exports = { createFakeClock };
