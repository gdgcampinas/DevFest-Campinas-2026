/**
 * Feature: página Código de conduta. Renderiza 100% a partir de CODE_OF_CONDUCT (data/cod.js) + CONTACT
 * (data/contact.js) — trocar texto ou canal de contato não toca aqui. Intro reusa o cartão de
 * team-intro-card (mesmo idioma visual de "Quem somos"), as regras reusam o card com ícone de
 * info-card.js (mesmo padrão de "Sobre"/"Antes de vir"), o contato reusa .social-links do rodapé.
 */
function codContactLinksMarkup(contact) {
  const links = [
    { label: "Linktree", url: contact.linktree },
    { label: contact.email, url: `mailto:${contact.email}` },
    { label: "Instagram", url: contact.instagram },
  ];
  return links.map(link => `<a href="${link.url}" target="_blank" rel="noopener">${link.label}</a>`).join("");
}

function renderCod(cod, contact, mountEl) {
  mountEl.innerHTML = `
    <div class="team-intro-card cod-intro-card">
      <h2>${cod.title}</h2>
      <p>${cod.intro}</p>
    </div>
    <div class="faq-grid cod-rules" id="codRulesGrid"></div>
    <div class="faq-item cod-contact" style="--track-color:var(--accent)">
      <div class="faq-icon">${iconMarkup("chat")}</div>
      <h3>${cod.contact.title}</h3>
      <p>${cod.contact.body}</p>
      <div class="social-links cod-contact-links">${codContactLinksMarkup(contact)}</div>
    </div>`;
  renderInfoCards(cod.rules.map(rule => ({ ...rule, id: rule.title, icon: iconMarkup(rule.icon) })), document.getElementById("codRulesGrid"));
}
