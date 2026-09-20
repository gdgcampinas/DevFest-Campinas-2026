/**
 * Feature: galeria de todos os palestrantes, extraída automaticamente
 * de SCHEDULE (sem duplicar dado em nenhum outro arquivo). Dedup por
 * `id` (ou nome, se o palestrante não tiver id): quem fala em mais de
 * um slot aparece uma vez só, com todas as suas palestras listadas.
 * Cada palestra listada abre o mesmo modal da Grade (ver TALK_TRIGGER
 * em talk-modal.js). Some por completo antes da revelação do line-up.
 * O mesmo extractSpeakers() alimenta os Destaques da home.
 */
function extractSpeakers(schedule, tracks, timezone) {
  const people = new Map();
  schedule.forEach((slot, slotIndex) => {
    if (!slot.talks) return;
    tracks.forEach(track => {
      const data = slot.talks[track.id];
      if (!data) return;
      const talkRef = { track, slotIndex, title: data.title, startLabel: formatEventTime(slot.start, timezone) };
      speakerList(data).forEach(speaker => {
        const key = speaker.id ?? speaker.name;
        if (!people.has(key)) people.set(key, { ...speaker, track, talks: [] });
        people.get(key).talks.push(talkRef);
      });
    });
  });
  return [...people.values()];
}

/** Palestra da pessoa: bloco clicável (abre o modal), com a cor da trilha dela. */
function speakerTalkRefMarkup(ref) {
  return `
    <div class="speaker-talk" role="button" tabindex="0" data-slot-index="${ref.slotIndex}" data-track="${ref.track.id}" style="--track-color:${ref.track.color}">
      <span class="speaker-talk-track"><span class="dot" style="background:${ref.track.color}"></span>${ref.track.shortLabel} · ${ref.startLabel}</span>
      <span class="speaker-talk-title">${ref.title}</span>
    </div>`;
}

/** Reusa avatarMarkup (components/avatar.js), speakerMetaLine (track-card.js), socialIconMarkup (person-card.js) e speakerAnchorId (speaker-link.js) — nada reescrito aqui. */
function speakerGalleryCardMarkup(speaker) {
  const avatar = avatarMarkup(speaker.name, speaker.photo, "speaker-photo");
  const meta = speakerMetaLine(speaker);
  const social = speaker.linkedin
    ? socialIconMarkup({ name: "linkedin", link: speaker.linkedin })
    : "";
  const anchor = speaker.id ? ` id="${speakerAnchorId(speaker)}"` : "";
  return `
    <div class="speaker-card"${anchor} style="--track-color:${speaker.track.color}">
      ${avatar}
      <div class="speaker-card-name">${speaker.name}</div>
      ${meta ? `<div class="speaker-card-meta">${meta}</div>` : ""}
      ${social}
      <div class="speaker-talks">${speaker.talks.map(speakerTalkRefMarkup).join("")}</div>
    </div>`;
}

/** Destaca e rola até o card do palestrante indicado no #hash (vindo do modal ou dos Destaques). */
function focusSpeakerFromHash(gridEl) {
  gridEl.querySelectorAll(".speaker-card.is-target").forEach(card => card.classList.remove("is-target"));
  const id = decodeURIComponent(location.hash.slice(1));
  const card = id ? gridEl.querySelector(`#${CSS.escape(id)}`) : null;
  if (!card) return;
  card.classList.add("is-target");
  card.scrollIntoView({ block: "center", behavior: "smooth" });
}

function renderSpeakersSection(schedule, tracks, sectionEl, gridEl, { reveal = true, timezone } = {}) {
  if (!reveal) {
    sectionEl.hidden = true;
    return;
  }
  const speakers = extractSpeakers(schedule, tracks, timezone);
  sectionEl.hidden = speakers.length === 0;
  if (speakers.length === 0) return;
  gridEl.innerHTML = speakers.map(speakerGalleryCardMarkup).join("");
  focusSpeakerFromHash(gridEl);
  window.addEventListener("hashchange", () => focusSpeakerFromHash(gridEl));
}
