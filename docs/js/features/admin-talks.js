/**
 * Feature: a palestra de cada trilha pro admin, na mesma regra do site (`SCHEDULE`, `talkShareCode`). Por trilha devolve:
 *   phase    "live" (tem palestra no ar agora), "next" (a próxima que vai começar) ou "none" (acabaram as palestras da trilha)
 *   talk     a palestra no ar ou a próxima: { title, start, end, code } (ou null)
 *   contest  a palestra da trilha que tem CONCURSO (Coding Jam), no ar ou não: { title, start, end, code } (ou null): é por ela que se abre o pódio
 * `describeRoomLine` (o texto de cada sala) e `adminTrackLinks` (os botões de uma trilha, a partir de data/admin-sections.js) saem daqui também.
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

const ADMIN_PHASE_LABEL = { live: "no ar", next: "próxima", none: "sem palestra" };

/** "no ar, Título (09:00)", "próxima, Título (10:30)" ou "sem palestra". `formatTime(date)` é injetado. */
function describeRoomLine(room, formatTime) {
  return room.talk ? `${ADMIN_PHASE_LABEL[room.phase]}, ${room.talk.title} (${formatTime(room.talk.start)})` : ADMIN_PHASE_LABEL.none;
}

/**
 * Os botões de uma trilha: cada `spec` de ADMIN_TRACK_LINKS vira { id, label, href }. O endereço leva `?trilha=<id>`; `withTalkCode` junta `&palestra=<código>` da palestra com concurso da trilha
 * (e o botão só existe se a trilha tem uma: `requires: "contest"`).
 */
function adminTrackLinks(room, specs) {
  return specs
    .filter(spec => spec.requires !== "contest" || room.contest)
    .map(spec => ({ id: spec.id, label: spec.label, href: `${spec.href}?trilha=${room.track.id}${spec.withTalkCode ? `&palestra=${room.contest.code}` : ""}` }));
}

/** As dependências do site pras telas que falam de palestras por trilha (seção Palestras e cartão "Salas agora"): grade, trilhas, relógio, código curto, concurso e o formato da hora. */
function defaultAdminTalksDeps() {
  return {
    schedule: SCHEDULE,
    tracks: TRACKS,
    now: resolveNow(),
    codeOf: (slot, trackId) => talkShareCode(slot, trackId, EVENT.timezone),
    hasContest: talkHighlightsRepository.hasContest,
    formatTime: value => formatEventTime(new Date(value), EVENT.timezone),
  };
}
