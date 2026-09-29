/**
 * Feature: página Time — intro ("Quem somos") + 2 grupos (organizador/
 * voluntário) filtrados do mesmo TEAM, cada grupo some sozinho se
 * vazio. Nenhum grid/card duplicado entre os grupos: mesmo
 * renderPersonGrid, só filtra por `type`.
 */
function renderTeamIntro(intro, mountEl) {
  mountEl.innerHTML = `<div class="team-intro-card"><h2>${intro.title}</h2><p>${intro.body}</p></div>`;
}

/**
 * Modal "Descubra mais sobre" de uma pessoa do time, sobre o modal genérico (components/modal.js).
 */
function createPersonModal() {
  const modal = createModal("personModal", { label: t("team.detail", "Sobre a pessoa") });
  return { ...modal, open: person => modal.openHTML(personDetailMarkup(person)) };
}

function renderTeamGroup(team, type, sectionEl, gridEl, { onSelect = null } = {}) {
  const people = team.filter(person => person.type === type);
  sectionEl.hidden = people.length === 0;
  if (people.length === 0) return;
  renderPersonGrid(people, gridEl, { onSelect });
}
