/**
 * As TELAS da história no telão (só marcação, tudo escapado; as cenas e a volta completa de mural-history-scene.js reusam as mesmas):
 *   mosaico   a grade de fotos de um evento (com o nome dele no canto) + título e agradecimento
 *   marco     um marco da linha do tempo em tela cheia: a foto (ou o selo, sem foto), o ano gigante, o título e o texto; foto com `fit: "contain"` (um logo largo) ocupa só o lado direito, inteira
 *   destaque  uma foto grande em tela cheia com a legenda "Evento ano"
 * Os números ({community}, {devfest}) e o ano da fundação entram DEPOIS de escapar o texto, em destaque (components/number-template.js).
 */
function historyViewLabel(photo) {
  return photo.event ? [photo.event, photo.year].filter(Boolean).join(" ") : "";
}

function historyMosaicViewMarkup({ photos, label = "", text, years, founded }) {
  const columns = Math.min(4, photos.length); // linhas incompletas ficam centradas, nunca com buraco no canto (CSS: .ms-history-grid)
  const rows = Math.ceil(photos.length / columns);
  const tiles = photos.map((photo, index) => `<figure class="ms-history-tile ms-stagger"${muralStagger(index)}><img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.alt)}"></figure>`).join("");
  return `<section class="ms ms-history">
      <div class="ms-history-top">
        <header class="ms-head"><span class="ms-kicker">${escapeHtml(text.kicker)}</span><h2 class="ms-title">${numberTemplateMarkup(text.sceneTitle, years)}</h2></header>
        ${label ? `<p class="ms-history-label">${escapeHtml(label)}</p>` : ""}
      </div>
      <div class="ms-history-grid" data-count="${photos.length}" style="--cols:${columns};--rows:${rows};--rows-tall:${Math.ceil(photos.length / 2)}">${tiles}</div>
      <p class="ms-hint ms-history-thanks">${numberTemplateMarkup(text.sceneThanks, { founded })}</p>
    </section>`;
}

function historyMarcoViewMarkup({ milestone, photo = null, years, seconds = 0 }) {
  const media = photo
    ? `<div class="ms-art ms-history-media${photo.fit === "contain" ? " ms-history-media--side" : ""}">${muralArtMarkup({ file: photo.file, alt: photo.alt, fit: photo.fit ?? "cover" })}</div>`
    : `<div class="ms-history-badge" aria-hidden="true">${escapeHtml(milestone.badge)}</div>`;
  return `<section class="ms ms-history-marco" data-kind="${photo ? "photo" : "badge"}"${seconds ? ` style="--step-ms:${seconds * 1000}"` : ""}>
      ${media}
      <div class="ms-history-marco-text">
        <span class="ms-history-year">${escapeHtml(milestone.year)}</span>
        <h2 class="ms-title">${numberTemplateMarkup(milestone.title, years)}</h2>
        <p>${numberTemplateMarkup(milestone.text, years)}</p>
      </div>
    </section>`;
}

function historyDestaqueViewMarkup({ photo, seconds = 0 }) {
  const label = historyViewLabel(photo);
  return `<section class="ms ms-art ms-history-destaque"${seconds ? ` style="--step-ms:${seconds * 1000}"` : ""}>
      ${muralArtMarkup({ file: photo.hd ?? photo.file, alt: photo.alt, fit: "contain" })}
      ${label ? `<p class="ms-history-caption">${escapeHtml(label)}</p>` : ""}
    </section>`;
}

/** Os endereços das imagens de um passo (pra pré-carregar antes de mostrar). */
function historyStepFiles(step) {
  if (step.kind === "marco") return step.item.photo ? [step.item.photo.file] : [];
  if (step.kind === "mosaico") return step.page.photos.map(photo => photo.file);
  return [step.photo.hd ?? step.photo.file];
}
