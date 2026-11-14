/**
 * Cena "Palestrantes": UM DE CADA TRILHA por passada (o baralho de features/featured-deck.js, o mesmo dos Destaques da home), com foto, nome, cargo, trilha e a palestra. Cada vez que a cena volta
 * mostra as próximas pessoas do baralho: todos os palestrantes passam, uma vez por volta, sem repetir antes de todos (com 5 trilhas e 45 palestrantes, a volta fecha em 9 passadas). Entradas
 * do dado com o mesmo `params.deck` compartilham o baralho (continuam de onde a outra parou). `params.count` = quantos por passada (padrão: o número de trilhas). Foto que não carrega (ou demora)
 * cai nas iniciais com a cor da trilha, sem atrasar a cena. Sem palestrante a cena não aparece. Quem fala na plenária entra como todo mundo (o cartão mostra "Plenária").
 * Tudo injetado: `pool` (extractSpeakers, features/speakers.js), `slots` (padrão), `preload(url)` (com tempo limite curto), `metaOf(pessoa)` (speakerMetaLine), `createDeck` (padrão createFeaturedDeck).
 */
function createSpeakersScene({ pool, slots, preload, metaOf = person => person.title ?? "", createDeck = createFeaturedDeck }) {
  const decks = new Map();
  const deckFor = params => {
    const key = params.deck ?? "palestrantes";
    if (!decks.has(key)) decks.set(key, createDeck(pool, { slots: params.count ?? slots }));
    return decks.get(key);
  };
  return {
    async prepare(params) {
      const people = deckFor(params).next();
      if (!people.length) return MURAL_SKIP;
      const photos = await Promise.all(people.map(person => (person.photo ? preload(person.photo).then(() => person.photo, () => null) : null)));
      return { people: people.map((person, index) => ({ ...person, photo: photos[index] })) };
    },
    render({ people }, params) {
      const cards = people.map((person, index) => {
        const label = person.keynote ? "Plenária" : (person.track?.shortLabel ?? person.track?.label ?? "");
        const meta = metaOf(person);
        const talk = person.talks?.[0]?.title;
        return `<figure class="ms-speaker ms-stagger"${muralStagger(index, `--track-color:${escapeHtml(person.track?.color ?? "var(--accent)")}`)}>
          ${avatarMarkup(person.name, person.photo, "ms-avatar")}
          ${label ? `<span class="ms-speaker-track">${escapeHtml(label)}</span>` : ""}
          <figcaption><b>${escapeHtml(person.name)}</b>${meta ? `<span>${escapeHtml(muralShorten(meta, 70))}</span>` : ""}${talk ? `<em>“${escapeHtml(muralShorten(talk, 90))}”</em>` : ""}</figcaption>
        </figure>`;
      }).join("");
      return { markup: `<section class="ms ms-speakers">${muralHeadMarkup({ kicker: params.kicker, title: params.title })}<div class="ms-speakers-row" data-count="${people.length}" style="--n:${people.length}">${cards}</div></section>` };
    },
  };
}
