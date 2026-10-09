/**
 * Cena "Quem faz o DevFest acontecer": UMA pessoa do time por passada (organizadores e voluntários, na ordem do dado), com foto grande, nome, cargo e a mini-bio curta, e a mensagem de
 * acolhimento do dado ("Gente como você, de casa"). Cada vez que a cena volta mostra a próxima pessoa (`rotation`, compartilhado entre as entradas do dado). Foto que não carrega (ou demora)
 * cai nas iniciais com a cor do grupo, sem atrasar a cena; sem bio mostra só o cargo. `params.maxBio` limita o tamanho do texto (padrão 220). Sem ninguém no time a cena não aparece.
 * Tudo injetado: `repository` (data/team.js: getAll), `preload(url)` (com tempo limite curto), `rotation` (features/mural-rotation.js).
 */
function createTeamScene({ repository, preload, rotation }) {
  return {
    async prepare(params) {
      const people = repository.getAll();
      const index = rotation.next(params.rotation ?? "team", people.length);
      if (index < 0) return MURAL_SKIP;
      const person = people[index];
      const photo = person.photo ? await preload(person.photo).then(() => person.photo, () => null) : null;
      return { person, photo };
    },
    render({ person, photo }, params) {
      const group = person.type === "organizador" ? "Organização" : "Voluntariado";
      return {
        markup: `<section class="ms ms-team" style="--track-color:${escapeHtml(person.trackColor)}">
          <div class="ms-team-photo">${avatarMarkup(person.name, photo, "ms-avatar")}</div>
          <div class="ms-team-text">
            ${muralHeadMarkup({ kicker: params.kicker, title: params.title })}
            <h3 class="ms-team-name">${escapeHtml(person.name)}</h3>
            <p class="ms-team-role"><b>${group}</b>${person.role ? ` · ${escapeHtml(person.role)}` : ""}</p>
            ${person.bio ? `<p class="ms-hint ms-team-bio">${escapeHtml(muralShorten(person.bio, params.maxBio ?? 220))}</p>` : ""}
          </div>
        </section>`,
      };
    },
  };
}
