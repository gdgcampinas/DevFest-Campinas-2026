/**
 * Conteúdo do modal "Descubra mais sobre" de uma pessoa do time: foto maior (avatar.js, com o mesmo
 * fallback de iniciais), nome, cargo, mini-bio e LinkedIn. Só desenha; quem abre é features/team.js
 * (createPersonModal), sobre components/modal.js. Texto vindo dos dados passa por escapeHtml.
 */
function personDetailMarkup(person, { heading = "" } = {}) {
  const linkedin = (person.social || []).find(social => social.name === "linkedin");
  return `
    <div class="person-detail">
      ${heading ? `<p class="person-detail-heading">${escapeHtml(heading)}</p>` : ""}
      ${avatarMarkup(person.name, person.photo, "person-detail-photo")}
      <h3 class="person-detail-name">${escapeHtml(person.name)}</h3>
      ${person.role ? `<p class="person-detail-role">${escapeHtml(person.role)}</p>` : ""}
      ${person.bio ? `<p class="person-detail-bio">${escapeHtml(person.bio)}</p>` : ""}
      ${linkedin ? `<a class="person-detail-link" href="${escapeHtml(linkedin.link)}" target="_blank" rel="noopener">${escapeHtml(t("team.linkedin", "Ver no LinkedIn"))} →</a>` : ""}
    </div>`;
}
