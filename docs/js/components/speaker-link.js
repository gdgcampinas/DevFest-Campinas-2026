/**
 * Ligação palestrante <-> página Palestrantes: único lugar que sabe
 * como um palestrante vira âncora e link de perfil. Usado pela
 * galeria (id do card), pelo modal da palestra e pelos Destaques.
 * Palestrante sem `id` não tem perfil linkável (retorna "").
 */
const SPEAKERS_PAGE = "palestrantes.html";

function speakerAnchorId(speaker) {
  return `speaker-${speaker.id}`;
}

function speakerProfileHref(speaker) {
  return speaker.id ? `${SPEAKERS_PAGE}#${speakerAnchorId(speaker)}` : "";
}
