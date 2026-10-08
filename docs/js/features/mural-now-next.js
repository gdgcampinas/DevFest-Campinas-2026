/**
 * "Agora e próximas" do mural: o que cada trilha tem no ar e o que vem a seguir, calculado só a partir da grade e da hora (função pura, dual:
 * navegador e Node, testada em DevFestIA/tools/mural). Reusa resolveEventState (features/live-status.js) pra fase do evento.
 *
 * Saída: { phase: "before" | "live" | "after", banner, columns }
 *   banner   o bloco sem palestra no ar agora (Almoço, Credenciamento...) ou null: { title, room, start, end }
 *   columns  uma por trilha: { track, current, next }, onde current/next são { title, speakers, people, blurb, tags, start, end, highlight } ou null
 *            (`speakers` = só os nomes; `people` = { name, title, photo } de cada pessoa; `blurb` = texto curto da palestra: o campo `blurb` do dado ou,
 *            sem ele, a `description`)
 *            (`next` é a próxima palestra DEPOIS da atual; sem palestra no ar, é a próxima a começar)
 */
function describeTalk(slot, data) {
  const speakers = data.speakers ?? [];
  return {
    title: data.title,
    speakers: speakers.map(speaker => speaker.name),
    people: speakers.map(speaker => ({ name: speaker.name, title: speaker.title ?? "", photo: speaker.photo ?? null })),
    blurb: data.blurb ?? data.description ?? "",
    tags: data.tags ?? [],
    start: slot.start,
    end: slot.end,
    highlight: data.highlight ?? null,
  };
}

function resolveNowAndNext({ schedule, tracks, now, phaseOf }) {
  const state = phaseOf(now, schedule);
  const active = state.activeSlot ?? null;
  const columns = tracks.map(track => {
    const talkSlots = schedule.filter(slot => slot.talks?.[track.id]);
    const live = talkSlots.find(slot => now >= slot.start && now < slot.end);
    const upcoming = talkSlots.find(slot => slot.start > now);
    return {
      track,
      current: live ? describeTalk(live, live.talks[track.id]) : null,
      next: upcoming ? describeTalk(upcoming, upcoming.talks[track.id]) : null,
    };
  });
  const banner = active?.banner ? { title: active.banner, room: active.room ?? null, start: active.start, end: active.end } : null;
  return { phase: state.phase, banner, columns };
}

if (typeof module !== "undefined") module.exports = { resolveNowAndNext, describeTalk };
