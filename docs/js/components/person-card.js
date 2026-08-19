/**
 * Card genérico de pessoa — usado na seção de organizadores/time.
 * Foto é opcional (mostra iniciais se faltar); LinkedIn é opcional.
 */
function initials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function personCardMarkup(person) {
  const photo = person.photo
    ? `<img class="person-photo" src="${person.photo}" alt="${person.name}" loading="lazy">`
    : `<div class="person-photo person-photo--fallback">${initials(person.name)}</div>`;
  const social = person.linkedin
    ? `<a class="person-social" href="${person.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn de ${person.name}">in</a>`
    : "";
  return `
    <div class="person-card">
      ${photo}
      <div class="person-name">${person.name}</div>
      ${person.role ? `<div class="person-role">${person.role}</div>` : ""}
      ${social}
    </div>`;
}

function renderPersonGrid(people, mountEl) {
  mountEl.innerHTML = people.map(personCardMarkup).join("");
}
