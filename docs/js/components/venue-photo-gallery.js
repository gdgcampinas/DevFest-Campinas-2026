/**
 * Componente: a galeria de fotos do campus e a foto ampliada (só marcação, tudo escapado e por parâmetro): `photos` (data/venue-photos.js, a `featured` primeiro), `text` e `link` ({ label, url }, opcional).
 * Hooks: `data-photo` (o botão de cada foto, com o id), `data-photo-step` (anterior/próxima na foto ampliada: -1 ou 1).
 */
const venuePhotoTrack = (name, target) => trackAttrs(name, { place: "venue_photos", target });

/** Uma foto da galeria: um botão (abre ampliada) com a imagem e a legenda. A `featured` ocupa a linha inteira (classe `vp-item--featured`). */
function venuePhotoTileMarkup(photo, text) {
  const modifier = photo.featured ? " vp-item--featured" : "";
  return `<li class="vp-item${modifier}"><button type="button" class="vp-tile" data-photo="${escapeHtml(photo.id)}" aria-label="${escapeHtml(`${text.open}: ${photo.caption}`)}"${venuePhotoTrack("venue_photo_open", photo.id)}><img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.caption)}" loading="lazy" decoding="async"><span class="vp-caption">${escapeHtml(photo.caption)}</span></button></li>`;
}

function venuePhotoLinkMarkup(link) {
  return link?.url ? `<a class="chip-btn vp-link" href="${escapeHtml(link.url)}" target="_blank" rel="noopener"${venuePhotoTrack("venue_photo_link", "campus")}>${escapeHtml(link.label)}</a>` : "";
}

function venuePhotoGalleryMarkup({ photos, text, link = null }) {
  const linkMarkup = venuePhotoLinkMarkup(link);
  return `
    <div class="vp-head">
      <span class="vp-badge">${escapeHtml(text.badge)}</span>
      <h3>${escapeHtml(text.title)} <span>${escapeHtml(text.titleAccent)}</span></h3>
      <p>${escapeHtml(text.sub)}</p>
    </div>
    <ul class="vp-grid">${photos.map(photo => venuePhotoTileMarkup(photo, text)).join("")}</ul>
    ${linkMarkup ? `<div class="vp-foot">${linkMarkup}</div>` : ""}`;
}

/** "Foto 2 de 10": o contador da foto ampliada, a partir do modelo do texto (`{current}` e `{total}`). */
const venuePhotoCounter = (text, current, total) => text.counter.replace("{current}", current).replace("{total}", total);

/** A foto ampliada (dentro do modal): a imagem, a legenda e, com mais de uma foto, anterior/próxima e o contador. `index` é a posição em `photos`. */
function venuePhotoViewMarkup({ photos, index, text }) {
  const photo = photos[index];
  const step = (delta, label, symbol) => `<button type="button" class="vp-step" data-photo-step="${delta}" aria-label="${escapeHtml(label)}"${venuePhotoTrack("venue_photo_step", String(delta))}>${symbol}</button>`;
  return `
    <figure class="vp-view">
      <img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.caption)}" decoding="async">
      <figcaption><strong>${escapeHtml(photo.caption)}</strong>${photos.length > 1 ? `<span>${escapeHtml(venuePhotoCounter(text, index + 1, photos.length))}</span>` : ""}</figcaption>
    </figure>
    ${photos.length > 1 ? `<div class="vp-steps">${step(-1, text.previous, "‹")}${step(1, text.next, "›")}</div>` : ""}`;
}
