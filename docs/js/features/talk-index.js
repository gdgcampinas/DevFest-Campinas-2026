/**
 * Feature: índice de palestras do SCHEDULE por chave de favorito
 * (talkKey) e por código curto de compartilhamento. É o único lugar que
 * atravessa "slot x trilha" -> palestra, e converte uma palestra na
 * entrada genérica de calendário (calendar.js). Repository no mesmo
 * padrão dos outros: getAll() + métodos próprios.
 */

/** "0945.ia": horário de início no fuso do evento + id da trilha. Curto e estável entre versões da grade. */
function talkShareCode(slot, trackId, timezone) {
  return `${formatEventTime(slot.start, timezone, CODE_LOCALE).replace(":", "")}.${trackId}`;
}

/**
 * A rodada de uma sessão em paralelo (Coding Jam) no formato das palestras do índice, só pro calendário e pro link de compartilhar:
 * a chave é a de favorito (`parallelTalkKey`), o código é "horário.id da sessão" ("1000.codejam") e a "trilha" leva a etiqueta, a sala e a cor da sessão.
 */
function parallelIndexEntry(placement, timezone) {
  const { session, start, end } = placement;
  const slot = { start, end };
  const track = { id: session.trackId, label: session.kicker, room: session.place, color: session.color };
  const data = { title: session.name, description: session.description, highlight: session.highlightId };
  return { key: parallelTalkKey(placement), code: talkShareCode(slot, session.id, timezone), slot, slotIndex: -1, track, data };
}

/** `parallel` (opcional): as rodadas das sessões em paralelo (features/parallel-sessions.js), que entram no índice depois das palestras. */
function buildTalkIndex(schedule, tracks, timezone, { parallel = [] } = {}) {
  const entries = [];
  schedule.forEach((slot, slotIndex) => {
    const talks = slotTalks(slot);
    tracks.forEach(track => {
      const data = talks[track.id];
      if (!data) return;
      entries.push({ key: talkKey(slot, track.id), code: talkShareCode(slot, track.id, timezone), slot, slotIndex, track, data });
    });
  });
  parallel.forEach(placement => entries.push(parallelIndexEntry(placement, timezone)));
  const byKey = new Map(entries.map(entry => [entry.key, entry]));
  const byCode = new Map(entries.map(entry => [entry.code, entry]));
  return createRepository(entries, {
    get: key => byKey.get(key),
    getByCode: code => byCode.get(code),
  });
}

/** Nomes de quem fala, na língua do site ("A e B", "A, B, C e D"); palestra sem palestrante devolve "". */
function talkSpeakerNames(data) {
  return new Intl.ListFormat(i18n.htmlLang, { type: "conjunction" }).format(speakerList(data).map(speaker => speaker.name));
}

/** Entrada de calendário de uma palestra. `siteUrl` aponta pra grade completa. */
function talkToCalendarEntry(entry, event, siteUrl) {
  const speakers = talkSpeakerNames(entry.data);
  const highlight = talkHighlightsRepository.forTalk(entry.data);
  return {
    uid: `${entry.code}@devfestcampinas`,
    title: entry.data.title,
    start: entry.slot.start,
    end: entry.slot.end,
    location: eventLocationLabel(event, entry.track.room),
    details: [speakers && t("calendar.speakers", "Palestrante(s): {names}", { names: speakers }), t("calendar.track", "Trilha: {track}", { track: entry.track.label }), highlight && [highlight.label, highlight.tagline].filter(Boolean).join(": "), entry.data.description, t("calendar.fullSchedule", "Grade completa: {url}", { url: siteUrl })]
      .filter(Boolean).join("\n"),
    url: siteUrl,
  };
}
