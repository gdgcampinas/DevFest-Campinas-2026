/**
 * Cena "ONDE ESTAMOS": a foto do prédio do evento em tela cheia (a `featured` de data/venue-photos.js, ou a de `params.photo`) e, numa faixa embaixo, o prédio, o campus, por onde entrar e o endereço (data/venue.js).
 * `params.kicker` é o rótulo de cima ("Onde estamos") e `params.focus` o ponto da foto que não pode ser cortado em telões de outra proporção (padrão "50% 60%"). A foto é pré-carregada com tempo limite: se não carregar a cena falha e descansa.
 * Sem foto a cena não aparece (MURAL_SKIP). Tudo injetado: `photos` (venuePhotosRepository), `place` (função que devolve o local: venueRepository.getAll()) e `preload` (features/image-preload.js).
 */
function createVenueScene({ photos, place, preload }) {
  const photoOf = params => (params.photo ? photos.getById(params.photo) : photos.featured());
  return {
    async prepare(params) {
      const photo = photoOf(params);
      if (!photo) return MURAL_SKIP;
      await preload(photo.file);
      return photo;
    },
    render(photo, params) {
      const { building, venue, entrance, address } = place();
      const art = { file: photo.file, alt: photo.caption, fit: "cover", focus: params.focus ?? "50% 60%" };
      const line = [venue, entrance].filter(Boolean).join(" · ");
      return {
        markup: `<section class="ms ms-art ms-venue">${muralArtMarkup(art)}
          <div class="ms-venue-bar">
            ${params.kicker ? `<span class="ms-kicker">${escapeHtml(params.kicker)}</span>` : ""}
            <h2 class="ms-venue-title">${escapeHtml(building ?? venue ?? "")}</h2>
            ${line ? `<p class="ms-venue-line">${escapeHtml(line)}</p>` : ""}
            ${address ? `<p class="ms-venue-address">${escapeHtml(address)}</p>` : ""}
          </div>
        </section>`,
      };
    },
  };
}
