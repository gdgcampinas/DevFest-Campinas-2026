/**
 * Feature: galeria de todos os palestrantes — extraída automaticamente
 * de SCHEDULE, sem duplicar dado em nenhum outro arquivo. Dedup por
 * nome (uma pessoa que fala em mais de um slot aparece uma vez só).
 * Some por completo antes da revelação do line-up — nomes mock não
 * fazem sentido numa vitrine de "quem vai falar".
 */
function extractSpeakers(schedule, tracks) {
  const seen = new Map();
  schedule.forEach(slot => {
    if (!slot.talks) return;
    tracks.forEach(track => {
      const data = slot.talks[track.id];
      if (!data) return;
      speakerList(data).forEach(speaker => {
        if (seen.has(speaker.name)) return;
        seen.set(speaker.name, { ...speaker, track, talkTitle: data.title });
      });
    });
  });
  return [...seen.values()];
}

/** Reusa avatarMarkup (components/avatar.js), speakerMetaLine e .person-social (já em styles.css) — nada novo duplicado aqui. */
function speakerGalleryCardMarkup(speaker) {
  const avatar = avatarMarkup(speaker.name, speaker.photo, "speaker-photo");
  const meta = speakerMetaLine(speaker);
  const social = speaker.linkedin
    ? `<a class="person-social" href="${speaker.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn de ${speaker.name}">in</a>`
    : "";
  return `
    <div class="speaker-card" style="--track-color:${speaker.track.color}">
      ${avatar}
      <div class="speaker-card-name">${speaker.name}</div>
      ${meta ? `<div class="speaker-card-meta">${meta}</div>` : ""}
      ${speaker.talkTitle ? `<div class="speaker-card-talk">${speaker.talkTitle}</div>` : ""}
      ${social}
    </div>`;
}

function renderSpeakersSection(schedule, tracks, sectionEl, gridEl, { reveal = true } = {}) {
  if (!reveal) {
    sectionEl.hidden = true;
    return;
  }
  const speakers = extractSpeakers(schedule, tracks);
  sectionEl.hidden = speakers.length === 0;
  if (speakers.length === 0) return;
  gridEl.innerHTML = speakers.map(speakerGalleryCardMarkup).join("");
}
