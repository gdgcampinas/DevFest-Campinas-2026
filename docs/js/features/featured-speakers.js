/**
 * Feature: "Destaques" — N palestrantes do pool, UM DE CADA TRILHA (sorteia quais trilhas entram quando há mais trilhas que vagas e quem fala por
 * trilha), foto redonda (avatarMarkup, mesmo componente do resto do site) com o anel e o rótulo na cor da trilha. Sorteia
 * de novo a cada reload E a cada intervalo (setInterval) — mesma
 * função pros dois casos, só chamada em momentos diferentes. O pool é o
 * mesmo extractSpeakers() da galeria (features/speakers.js), então cada
 * destaque leva ao perfil da própria pessoa em Palestrantes.
 */
function shuffled(list, random = Math.random) {
  return [...list].sort(() => random() - 0.5);
}

/**
 * `count` pessoas, no máximo uma por trilha (a trilha é a `track` da pessoa): embaralha as trilhas, sorteia uma pessoa de cada e embaralha o resultado.
 * Se houver menos trilhas que `count`, completa com quem sobrou. `random` entra por parâmetro (testes).
 */
function pickOnePerTrack(pool, count, random = Math.random) {
  const byTrack = new Map();
  shuffled(pool, random).forEach(person => {
    const key = person.track?.id ?? person.name;
    byTrack.set(key, [...(byTrack.get(key) ?? []), person]);
  });
  const firstOfEach = shuffled([...byTrack.values()], random).map(people => people[0]);
  const chosen = firstOfEach.slice(0, count);
  const rest = shuffled(pool.filter(person => !chosen.includes(person)), random);
  return shuffled([...chosen, ...rest].slice(0, count), random);
}

function featuredSpeakerCardMarkup(person) {
  const meta = speakerMetaLine(person);
  const profile = speakerProfileHref(person);
  const tag = profile ? "a" : "div";
  const talkTitle = person.talks?.[0]?.title;
  const href = profile ? ` href="${profile}" data-track-event="speaker_profile" data-track-target="featured"` : "";
  return `
    <${tag} class="featured-speaker"${href}${person.track ? ` style="--track-color:${person.track.color}"` : ""}>
      ${avatarMarkup(person.name, person.photo, "featured-avatar", { meta, talks: (person.talks ?? []).map(talk => talk.title), color: person.track?.color })}
      ${person.track ? `<span class="featured-track">${person.track.shortLabel ?? person.track.label}</span>` : ""}
      <div class="featured-name">${person.name}</div>
      ${meta ? `<div class="featured-company">${meta}</div>` : ""}
      ${talkTitle ? `<div class="featured-talk">“${talkTitle}”</div>` : ""}
    </${tag}>`;
}

function renderFeaturedSpeakers(pool, gridEl, count) {
  gridEl.innerHTML = pickOnePerTrack(pool, count).map(featuredSpeakerCardMarkup).join("");
}

/**
 * Liga a seção: some se o line-up não estiver revelado ou o pool estiver vazio; renderiza na hora (novo
 * sorteio a cada carregamento de página) e troca sozinho a cada
 * `intervalMs`. Retorna o intervalId — chamador não precisa, mas fica
 * disponível se algum dia quiser parar a rotação.
 */
function initFeaturedSpeakers(pool, sectionEl, gridEl, { count = 4, intervalMs = 15000, reveal = true } = {}) {
  if (!reveal || !pool.length) {
    sectionEl.hidden = true;
    return null;
  }
  sectionEl.hidden = false;
  renderFeaturedSpeakers(pool, gridEl, count);
  return setInterval(() => renderFeaturedSpeakers(pool, gridEl, count), intervalMs);
}
