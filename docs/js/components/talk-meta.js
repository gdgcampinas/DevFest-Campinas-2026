/**
 * Peças do card/detalhe de palestra que só existem quando o dado
 * vem preenchido: formato + tags de tema, avatares e links dos
 * palestrantes. Todas devolvem "" quando não há o que mostrar,
 * então palestra sem esses campos renderiza sem linha extra.
 * A cor vem sempre de --track-color, herdada do card.
 */
const MAX_TOPICS = 2;
const MAX_AVATARS = 3;

function talkTagsMarkup(data, highlight = talkHighlightsRepository.forTalk(data)) {
  const format = talkFormatsRepository.getById(data.format);
  const formatChip = format ? `<span class="talk-format">${iconMarkup(format.icon)}${format.label}</span>` : "";
  const chip = formatChip + (highlight ? talkHighlightChipMarkup(highlight) : "");
  const topics = (data.tags || []).slice(0, MAX_TOPICS).map(tag => `<span>${tag}</span>`).join("");
  if (!chip && !topics) return "";
  return `<div class="talk-tags">${chip}${topics ? `<div class="talk-topics">${topics}</div>` : ""}</div>`;
}

/**
 * Quem aparece no card, no modal e na faixa "Agora:": os palestrantes da palestra ou, se não houver nenhum, o `host` do
 * destaque (ex.: GDG Campinas no Coding Jam). Fica fora de speakerList() de propósito: quem conduz não é palestrante da galeria.
 */
function talkWhoList(data) {
  const speakers = speakerList(data);
  if (speakers.length) return speakers;
  const host = talkHighlightsRepository.forTalk(data)?.host;
  return host ? [host] : [];
}

/** Sem palestrante revelado, mostra um avatar de interrogação (fallback de iniciais já resolve). */
function talkAvatarsMarkup(speakers) {
  const list = speakers.length ? speakers.slice(0, MAX_AVATARS) : [{ name: "?" }];
  return `<div class="talk-avatars">${list
    .map(speaker => `<span class="talk-avatar-ring">${avatarMarkup(speaker.name, speaker.photo, "talk-avatar")}</span>`)
    .join("")}</div>`;
}

/** Reusa socialIconMarkup (components/person-card.js) — só palestrantes com LinkedIn cadastrado. */
function talkLinksMarkup(speakers) {
  const links = speakers
    .filter(speaker => speaker.linkedin)
    .map(speaker => socialIconMarkup({ name: "linkedin", link: speaker.linkedin }))
    .join("");
  return links ? `<div class="talk-links">${links}</div>` : "";
}
