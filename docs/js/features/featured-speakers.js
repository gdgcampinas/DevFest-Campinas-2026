/**
 * Feature: "Destaques" — N palestrantes aleatórios do pool, foto
 * redonda (avatarMarkup, mesmo componente do resto do site). Sorteia
 * de novo a cada reload E a cada intervalo (setInterval) — mesma
 * função pros dois casos, só chamada em momentos diferentes. O pool é o
 * mesmo extractSpeakers() da galeria (features/speakers.js), então cada
 * destaque leva ao perfil da própria pessoa em Palestrantes.
 */
function pickRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function featuredSpeakerCardMarkup(person) {
  const meta = speakerMetaLine(person);
  const profile = speakerProfileHref(person);
  const tag = profile ? "a" : "div";
  const href = profile ? ` href="${profile}"` : "";
  return `
    <${tag} class="featured-speaker"${href}>
      ${avatarMarkup(person.name, person.photo, "featured-avatar")}
      <div class="featured-name">${person.name}</div>
      ${meta ? `<div class="featured-company">${meta}</div>` : ""}
    </${tag}>`;
}

function renderFeaturedSpeakers(pool, gridEl, count) {
  gridEl.innerHTML = pickRandom(pool, count).map(featuredSpeakerCardMarkup).join("");
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
