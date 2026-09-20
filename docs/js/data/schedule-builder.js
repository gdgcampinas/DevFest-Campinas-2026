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

/** Talk provisória (uma por trilha), rotacionando o pool de palestrantes — fallback quando o catálogo não cobre o slot. */
function placeholderTalks(tracks, speakerPool, talkIndex) {
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
 * Talks do catálogo para uma janela: liga cada `speakerIds` às pessoas
 * do pool (mesmos objetos, sem cópia). Id que não existe no pool é
 * avisado no console e ignorado, pra erro de dado nunca passar em branco.
 * Trilha sem palestra no catálogo cai no fallback só daquela trilha.
 */
function catalogTalks(tracks, speakerPool, talkCatalog, talkIndex) {
  const fallback = placeholderTalks(tracks, speakerPool, talkIndex);
  return Object.fromEntries(tracks.map(track => {
    const entry = talkCatalog.getFor(track.id, talkIndex);
    if (!entry) return [track.id, fallback[track.id]];
    const { speakerIds = [], ...talk } = entry;
    const speakers = speakerIds.map(id => {
      const speaker = speakerPool.find(candidate => candidate.id === id);
      if (!speaker) console.warn(`[schedule] palestrante "${id}" não existe (trilha ${track.id}, palestra ${talkIndex})`);
      return speaker;
    }).filter(Boolean);
    return [track.id, { ...talk, speakers }];
  }));
}

/**
 * Plano do dia → SCHEDULE. Cada item do plano é:
 *   { banner, room?, start, end }   → sessão combinada (credenciamento, almoço...)
 *   { talks: [{start, end}, ...] }  → uma sessão de palestras por janela
 * `talkCatalog` (opcional, ver data/mock-talks.js) traz título, formato, tags
 * e palestrantes por trilha/posição; sem ele, tudo vira placeholder.
 */
function buildSchedule(plan, { eventTime, tracks, speakerPool, talkCatalog = null }) {
  let talkIndex = 0;
  return plan.flatMap(item => {
    if (item.talks) {
      return item.talks.map(window => ({
        start: eventTime(window.start),
        end: eventTime(window.end),
        talks: talkCatalog ? catalogTalks(tracks, speakerPool, talkCatalog, talkIndex++) : placeholderTalks(tracks, speakerPool, talkIndex++),
      }));
    }
    const { start, end, ...banner } = item;
    return [{ start: eventTime(start), end: eventTime(end), ...banner }];
  });
}
