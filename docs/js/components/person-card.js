/**
 * Card genérico de pessoa — usado na seção de organizadores/time.
 * Foto/iniciais vêm de components/avatar.js (avatarMarkup) — não
 * duplica essa lógica aqui.
 */
function personCardMarkup(person) {
  const photo = avatarMarkup(person.name, person.photo, "person-photo");
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
