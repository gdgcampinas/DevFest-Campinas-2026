/**
 * Feature: "Destaques" — a cada `intervalMs` mostra a próxima tela do baralho de palestrantes (features/featured-deck.js: todos aparecem, ninguém repete antes de todos,
 * trilhas intercaladas), foto redonda (avatarMarkup, mesmo componente do resto do site) com o anel e o rótulo na cor da trilha. O pool é o mesmo extractSpeakers() da galeria
 * (features/speakers.js), então cada destaque leva ao perfil da própria pessoa em Palestrantes.
 */
function featuredSpeakerCardMarkup(person) {
  const meta = speakerMetaLine(person);
  const profile = person.href ?? speakerProfileHref(person); // `href` = quem não é palestrante da galeria (ex.: o Coding Jam em paralelo) leva à própria página
  const tag = profile ? "a" : "div";
  const talkTitle = person.talks?.[0]?.title;
  const href = profile ? ` href="${profile}" data-track-event="speaker_profile" data-track-target="featured"` : "";
  return `
    <${tag} class="featured-speaker"${href}${person.track ? ` style="--track-color:${person.track.color}"` : ""}>
      ${avatarMarkup(person.name, person.photo, "featured-avatar", person.href ? null : { meta, talks: (person.talks ?? []).map(talk => talk.title), color: person.track?.color })}
      ${person.keynote ? `<span class="featured-track">${t("featured.keynote", "Plenária")}</span>` : person.track ? `<span class="featured-track">${person.track.shortLabel ?? person.track.label}</span>` : ""}
      <div class="featured-name">${person.name}</div>
      ${meta ? `<div class="featured-company">${meta}</div>` : ""}
      ${talkTitle ? `<div class="featured-talk">“${talkTitle}”</div>` : ""}
    </${tag}>`;
}

/**
 * Mostra a próxima tela do baralho (features/featured-deck.js) no grid: todos os palestrantes passam, sem repetir antes de todos terem aparecido.
 */
function renderFeaturedFrame(deck, gridEl) {
  gridEl.innerHTML = deck.next().map(featuredSpeakerCardMarkup).join("");
}

/**
 * Liga a seção: some se o line-up não estiver revelado ou o pool estiver vazio; renderiza na hora e troca sozinha a cada `intervalMs`, sempre com a próxima
 * tela do baralho (features/featured-deck.js). NADA é fixo: todo o pool, os palestrantes (inclusive quem fala na plenária) e o card do Coding Jam (features/parallel-sessions.js),
 * gira junto e aparece uma vez por volta. Retorna o intervalId — chamador não precisa, mas fica disponível se algum dia quiser parar a rotação.
 */
function initFeaturedSpeakers(pool, sectionEl, gridEl, { count = 4, intervalMs = 15000, reveal = true, random = Math.random } = {}) {
  if (!reveal || !pool.length) {
    sectionEl.hidden = true;
    return null;
  }
  sectionEl.hidden = false;
  const deck = createFeaturedDeck(pool, { slots: count, random });
  renderFeaturedFrame(deck, gridEl);
  return setInterval(() => renderFeaturedFrame(deck, gridEl), intervalMs);
}
