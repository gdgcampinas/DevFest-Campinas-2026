/**
 * Cena "Rolando agora": UMA sala por vez, com a foto de quem fala, nome, cargo, título, texto curto, horário e uma barra de progresso que anda (e "faltam N min").
 * `params.slot` é a posição da sala entre as que têm palestra no ar naquele instante (0 = a primeira); sem sala nessa posição a cena não aparece (MURAL_SKIP),
 * então o dado tem uma entrada por posição (rolando-0 a rolando-3) e o rodízio passa pelas salas que estiverem ocupadas, sem repetir nem deixar buraco.
 * Foto que não carrega (ou demora) cai nas iniciais com a cor da trilha, sem atrasar a cena. Sessão sem palestrante (Coding Jam) usa quem conduz (`hostOf`).
 * Tudo injetado: `schedule`, `tracks`, `timezone`, `phaseOf`, `preloadPhoto` (com tempo limite curto), `hostOf(idDoDestaque)`.
 */
function spotlightPeople(talk, hostOf) {
  if (talk.people.length) return talk.people;
  const host = talk.highlight ? hostOf(talk.highlight) : null;
  return host ? [{ name: host.name, title: "", photo: host.photo ?? null }] : [];
}

function createSpotlightScene({ schedule, tracks, timezone, phaseOf, preloadPhoto, hostOf = () => null }) {
  const minutesLeft = (talk, now) => Math.max(0, Math.ceil((talk.end - now) / 60000));
  const leftText = minutes => (minutes > 0 ? `faltam ${minutes} min` : "últimos instantes");
  const progressOf = (talk, now) => Math.round(Math.min(1, Math.max(0, (now - talk.start) / (talk.end - talk.start))) * 100);

  return {
    async prepare(params, ctx) {
      const live = resolveNowAndNext({ schedule, tracks, now: ctx.now, phaseOf }).columns.filter(column => column.current);
      const entry = live[params.slot ?? 0];
      if (!entry) return MURAL_SKIP;
      const people = spotlightPeople(entry.current, hostOf);
      const photos = await Promise.all(people.map(person => (person.photo ? preloadPhoto(person.photo).then(() => person.photo, () => null) : null)));
      return { track: entry.track, talk: entry.current, people: people.map((person, index) => ({ ...person, photo: photos[index] })), position: params.slot ?? 0, total: live.length };
    },
    render({ track, talk, people, position, total }, _params, ctx) {
      const tags = talk.tags.slice(0, 3).map(tag => `<li>${escapeHtml(tag)}</li>`).join("");
      const dots = Array.from({ length: total }, (_, index) => `<i${index === position ? ' class="is-on"' : ""}></i>`).join("");
      const figures = people.map(person => `<figure class="ms-spot-person">${avatarMarkup(person.name, person.photo, "ms-avatar")}<figcaption><b>${escapeHtml(person.name)}</b>${person.title ? `<span>${escapeHtml(person.title)}</span>` : ""}</figcaption></figure>`).join("");
      return {
        markup: `<section class="ms ms-spotlight" style="--track-color:${track.color}">
          <header class="ms-spot-head"><span class="ms-spot-live">Rolando agora</span><span class="ms-spot-room">${escapeHtml(track.room ?? "")} · ${escapeHtml(track.label)}</span><span class="ms-spot-time">${muralTimeRange(talk.start, talk.end, timezone)}</span></header>
          <div class="ms-spot-body">
            <div class="ms-spot-people" data-count="${people.length}">${figures}</div>
            <div class="ms-spot-text"><h2 class="ms-title">${escapeHtml(talk.title)}</h2>${talk.blurb ? `<p class="ms-hint ms-spot-blurb">${escapeHtml(talk.blurb)}</p>` : ""}${tags ? `<ul class="ms-spot-tags">${tags}</ul>` : ""}</div>
          </div>
          <footer class="ms-spot-foot"><div class="ms-progress"><b data-progress style="width:${progressOf(talk, ctx.now)}%"></b></div><span class="ms-spot-left" data-left>${leftText(minutesLeft(talk, ctx.now))}</span><span class="ms-dots" aria-hidden="true">${dots}</span></footer>
        </section>`,
        mount: (el, deps) => scheduleEvery(deps.schedule, 1000, () => {
          const now = deps.clock();
          el.querySelector("[data-progress]").style.width = `${progressOf(talk, now)}%`;
          el.querySelector("[data-left]").textContent = leftText(minutesLeft(talk, now));
        }),
      };
    },
  };
}
