/**
 * Feature: índice de palestras do SCHEDULE por chave de favorito
 * (talkKey) e por código curto de compartilhamento. É o único lugar que
 * atravessa "slot x trilha" -> palestra, e converte uma palestra na
 * entrada genérica de calendário (calendar.js). Repository no mesmo
 * padrão dos outros: getAll() + métodos próprios.
 */

/** "0945.ia": horário de início no fuso do evento + id da trilha. Curto e estável entre versões da grade. */
function talkShareCode(slot, trackId, timezone) {
  return `${formatEventTime(slot.start, timezone).replace(":", "")}.${trackId}`;
}

function buildTalkIndex(schedule, tracks, timezone) {
  const entries = [];
  schedule.forEach((slot, slotIndex) => {
    if (!slot.talks) return;
    tracks.forEach(track => {
      const data = slot.talks[track.id];
      if (!data) return;
      entries.push({ key: talkKey(slot, track.id), code: talkShareCode(slot, track.id, timezone), slot, slotIndex, track, data });
    });
  });
  const byKey = new Map(entries.map(entry => [entry.key, entry]));
  const byCode = new Map(entries.map(entry => [entry.code, entry]));
  return createRepository(entries, {
    get: key => byKey.get(key),
    getByCode: code => byCode.get(code),
  });
}

/** Entrada de calendário de uma palestra. `siteUrl` aponta pra grade completa. */
function talkToCalendarEntry(entry, event, siteUrl) {
  const speakers = speakerList(entry.data).map(speaker => speaker.name).join(" e ");
  return {
    uid: `${entry.code}@devfestcampinas`,
    title: entry.data.title,
    start: entry.slot.start,
    end: entry.slot.end,
    location: eventLocationLabel(event, entry.track.room),
    details: [speakers && `Palestrante(s): ${speakers}`, `Trilha: ${entry.track.label}`, entry.data.description, `Grade completa: ${siteUrl}`]
      .filter(Boolean).join("\n"),
    url: siteUrl,
  };
}
