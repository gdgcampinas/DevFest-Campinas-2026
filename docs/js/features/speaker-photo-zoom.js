/**
 * Feature: clicar na foto de quem fala (Destaques, galeria de Palestrantes, card e modal da palestra) abre a foto grande num modal
 * (components/modal.js), com nome, cargo e a(s) palestra(s). A foto avisa que dá zoom pelos `data-zoom-*` que avatarMarkup
 * (components/avatar.js) escreve quando recebe `zoom`; este arquivo só escuta, em fase de captura, para o clique não também navegar
 * pro perfil (Destaques) nem abrir o modal da palestra (card). Texto vindo do dado passa por escapeHtml.
 */
function speakerZoomMarkup({ src, name, meta = "", talks = [], color = "" }) {
  const list = talks.filter(Boolean).map(title => `<li>${escapeHtml(title)}</li>`).join("");
  return `
    <div class="speaker-zoom"${color ? ` style="--track-color:${escapeHtml(color)}"` : ""}>
      <img class="speaker-zoom-photo" src="${escapeHtml(src)}" alt="${escapeHtml(name)}">
      <h3 class="speaker-zoom-name">${escapeHtml(name)}</h3>
      ${meta ? `<p class="speaker-zoom-meta">${escapeHtml(meta)}</p>` : ""}
      ${list ? `<ul class="speaker-zoom-talks">${list}</ul>` : ""}
    </div>`;
}

/** Lê o que avatarMarkup gravou na foto (`data-zoom-*`) e devolve os dados do zoom. */
function speakerZoomFromPhoto(img) {
  const { zoomName, zoomMeta, zoomTalks, zoomColor } = img.dataset;
  return { src: img.currentSrc || img.src, name: zoomName, meta: zoomMeta, talks: (zoomTalks ?? "").split("\n"), color: zoomColor };
}

function initSpeakerPhotoZoom({ rootEl = document, makeModal = createModal } = {}) {
  let modal = null;
  const open = img => {
    modal ??= makeModal("speakerPhotoModal", { label: t("speaker.photo", "Foto de quem fala") });
    modal.openHTML(speakerZoomMarkup(speakerZoomFromPhoto(img)));
  };
  rootEl.addEventListener("click", event => {
    const img = event.target.closest?.("img[data-zoom-photo]");
    if (!img) return;
    event.preventDefault();
    event.stopPropagation();
    open(img);
  }, true);
  rootEl.addEventListener("keydown", event => {
    const img = event.target.closest?.("img[data-zoom-photo]");
    if (!img || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    event.stopPropagation();
    open(img);
  }, true);
}
