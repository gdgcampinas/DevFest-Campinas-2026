/**
 * Construtores de grade — schedule.js/schedule.dev.js só declaram o
 * "plano do dia" (banners + blocos de palestra); a matemática de horário
 * e o mock de talks ficam aqui, uma vez só, por parâmetro.
 * Precisa carregar antes de schedule.dev.js/schedule.js.
 */

function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

function toHHMM(totalMinutes) {
  const pad = n => String(n).padStart(2, "0");
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

/**
 * N janelas consecutivas a partir de `startHHMM`: cada uma dura
 * `talkMin` (palestra + perguntas) e é seguida de `gapMin` de troca.
 * Ex.: talkWindows("09:00", 2) → 09:00-09:40, 09:45-10:25.
 */
function talkWindows(startHHMM, count, { talkMin = 40, gapMin = 5 } = {}) {
  const start = toMinutes(startHHMM);
  return Array.from({ length: count }, (_, i) => {
    const windowStart = start + i * (talkMin + gapMin);
    return { start: toHHMM(windowStart), end: toHHMM(windowStart + talkMin) };
  });
}

/** Talks mock (uma por trilha), rotacionando o pool de palestrantes até o line-up real. */
function mockTalks(tracks, speakerPool, talkIndex) {
  return Object.fromEntries(tracks.map((track, i) => [
    track.id,
    {
      speakers: [speakerPool[(talkIndex * tracks.length + i) % speakerPool.length]],
      title: "Título a confirmar",
      format: "palestra",
      description: "",
    },
  ]));
}

/**
 * Plano do dia → SCHEDULE. Cada item do plano é:
 *   { banner, room?, start, end }   → sessão combinada (credenciamento, almoço...)
 *   { talks: [{start, end}, ...] }  → uma sessão de palestras por janela
 */
function buildSchedule(plan, { eventTime, tracks, speakerPool }) {
  let talkIndex = 0;
  return plan.flatMap(item => {
    if (item.talks) {
      return item.talks.map(window => ({
        start: eventTime(window.start),
        end: eventTime(window.end),
        talks: mockTalks(tracks, speakerPool, talkIndex++),
      }));
    }
    const { start, end, ...banner } = item;
    return [{ start: eventTime(start), end: eventTime(end), ...banner }];
  });
}
