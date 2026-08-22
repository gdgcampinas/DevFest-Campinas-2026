/**
 * Card de pessoa (time) — foto cheia no topo, nome/cargo embaixo,
 * ícones sociais flutuando sobre a foto. Foto/iniciais vêm de
 * components/avatar.js — não duplica essa lógica aqui.
 */
function socialIconMarkup(social) {
  const glyph = social.name === "linkedin" ? "in" : social.name[0].toUpperCase();
  return `<a class="social-icon" href="${social.link}" target="_blank" rel="noopener" aria-label="${social.name}">${glyph}</a>`;
}

/** Primeiro nome normal, resto em destaque — mesmo padrão visual do card de referência. */
function personNameMarkup(name) {
  const [first, ...rest] = name.split(" ");
  return rest.length ? `${first} <strong>${rest.join(" ")}</strong>` : first;
}

function personCardMarkup(person) {
  const photo = avatarMarkup(person.name, person.photo, "person-photo");
  const socials = (person.social || []).map(socialIconMarkup).join("");
  return `
    <div class="person-card">
      <div class="person-photo-wrap">
        ${photo}
        ${socials ? `<div class="person-social">${socials}</div>` : ""}
      </div>
      <div class="person-info">
        <div class="person-name">${personNameMarkup(person.name)}</div>
        ${person.role ? `<div class="person-role">${person.role}</div>` : ""}
      </div>
    </div>`;
}

function renderPersonGrid(people, mountEl) {
  mountEl.innerHTML = people.map(personCardMarkup).join("");
}
