/**
 * Feature: página Time — intro ("Quem somos") + 2 grupos (organizador/
 * voluntário) filtrados do mesmo TEAM, cada grupo some sozinho se
 * vazio. Nenhum grid/card duplicado entre os grupos: mesmo
 * renderPersonGrid, só filtra por `type`.
 */
function renderTeamIntro(intro, mountEl) {
  mountEl.innerHTML = `<div class="about-block"><h3>${intro.title}</h3><p>${intro.body}</p></div>`;
}

function renderTeamGroup(team, type, sectionEl, gridEl) {
  const people = team.filter(person => person.type === type);
  sectionEl.hidden = people.length === 0;
  if (people.length === 0) return;
  renderPersonGrid(people, gridEl);
}
