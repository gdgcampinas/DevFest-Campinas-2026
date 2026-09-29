/**
 * Conteúdo do modal de detalhe de uma pessoa do time: foto sangrando até a borda do modal (mesmo
 * enquadramento do card, personCardMarkup em person-card.js), com a barra de cor da pessoa por cima —
 * "como os cards", sem título de seção — depois nome, cargo, mini-bio e LinkedIn. Só desenha; quem abre
 * é features/team.js (createPersonModal), sobre components/modal.js. Texto vindo dos dados passa por
 * escapeHtml. `personNameMarkup` vem de person-card.js (mesmo destaque do sobrenome no card).
 */
function personDetailMarkup(person) {
  const linkedin = (person.social || []).find(social => social.name === "linkedin");
  return `
    <div class="person-detail" style="--track-color:${person.trackColor ?? "transparent"}">
      <div class="person-detail-photo-wrap">${avatarMarkup(person.name, person.photo, "person-detail-photo")}</div>
      <h3 class="person-detail-name">${personNameMarkup(escapeHtml(person.name))}</h3>
      ${person.role ? `<p class="person-detail-role">${escapeHtml(person.role)}</p>` : ""}
      ${person.bio ? `<p class="person-detail-bio">${escapeHtml(person.bio)}</p>` : ""}
      ${linkedin ? `<a class="person-detail-link" href="${escapeHtml(linkedin.link)}" target="_blank" rel="noopener">${escapeHtml(t("team.linkedin", "Ver no LinkedIn"))} →</a>` : ""}
    </div>`;
}
