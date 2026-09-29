/**
 * Card de pessoa (time) — foto cheia no topo, nome/cargo embaixo,
 * ícones sociais flutuando sobre a foto. Foto/iniciais vêm de
 * components/avatar.js — não duplica essa lógica aqui.
 * Com `person.bio` o card vira clicável (role/tabindex, `data-person-index`); o clique é ligado por
 * renderPersonGrid via `onSelect`, o card só desenha.
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

/** `trackColor` (opcional) vira a barra no topo do card, mesmo padrão de --track-color de info-card.js: quem
 * chama decide a cor (ex.: um tom pra organizador, outro pra voluntário), o card só desenha. */
function personCardMarkup(person, index) {
  const clickable = Boolean(person.bio);
  const photo = avatarMarkup(person.name, person.photo, "person-photo");
  const socials = (person.social || []).map(socialIconMarkup).join("");
  return `
    <div class="person-card${clickable ? " clickable" : ""}" style="--track-color:${person.trackColor ?? "transparent"}"${clickable ? ` role="button" tabindex="0" data-person-index="${index}"` : ""}>
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

/** `onSelect(person)` (opcional) é chamado ao clicar (ou Enter/Espaço) num card com bio; links do card não disparam. */
function renderPersonGrid(people, mountEl, { onSelect = null } = {}) {
  mountEl.innerHTML = people.map(personCardMarkup).join("");
  if (!onSelect) return;
  const select = event => {
    if (event.target.closest("a")) return;
    const card = event.target.closest("[data-person-index]");
    if (card) onSelect(people[Number(card.dataset.personIndex)]);
  };
  mountEl.addEventListener("click", select);
  mountEl.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    select(event);
  });
}
