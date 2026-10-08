/**
 * Feature: a palestra de cada trilha pro admin, na mesma regra do site (`SCHEDULE`, `talkShareCode`). Por trilha devolve:
 *   phase    "live" (tem palestra no ar agora), "next" (a próxima que vai começar) ou "none" (acabaram as palestras da trilha)
 *   talk     a palestra no ar ou a próxima: { title, start, end, code } (ou null)
 *   contest  a palestra da trilha que tem CONCURSO (Coding Jam), no ar ou não: { title, start, end, code } (ou null): é por ela que se abre o pódio
 * Usada pela seção Palestras e pelo cartão "Salas agora" da visão geral (uma regra só). Pura (sem DOM, sem relógio próprio). Tudo por parâmetro: `schedule`, `tracks`, `now` (Date), `codeOf(slot, trackId)`,
 * `hasContest(talkData)` (padrão: nenhuma tem).
 */
function describeTrackTalks({ schedule, tracks, now, codeOf, hasContest = () => false }) {
  const describe = (slot, trackId) => ({ title: slot.talks[trackId].title, start: slot.start, end: slot.end, code: codeOf(slot, trackId) });
  return tracks.map(track => {
    const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
    const active = talkSlots.find(slot => now >= slot.start && now < slot.end);
    const next = talkSlots.find(slot => slot.start > now);
    const slot = active ?? next ?? null;
    const contestSlot = talkSlots.find(candidate => hasContest(candidate.talks[track.id]));
    return { track, phase: active ? "live" : next ? "next" : "none", talk: slot ? describe(slot, track.id) : null, contest: contestSlot ? describe(contestSlot, track.id) : null };
  });
}
