/**
 * Feature: toque numa imagem marcada com `data-zoom-src` (e `data-zoom-alt`) e ela abre grande num modal (components/modal.js). Genérico: serve para qualquer tela que queira
 * "toque para ampliar" (hoje, as telas do passo a passo dos créditos). `makeModal` e `label` entram por parâmetro; o texto passa por escapeHtml.
 */
function imageZoomMarkup({ src, alt = "" }) {
  return `<img class="image-zoom-img" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
}

function initImageZoom({ rootEl = document, label = "", makeModal = createModal } = {}) {
  let modal = null;
  rootEl.addEventListener("click", event => {
    const trigger = event.target.closest?.("[data-zoom-src]");
    if (!trigger) return;
    event.preventDefault();
    modal ??= makeModal("imageZoomModal", { label });
    modal.openHTML(imageZoomMarkup({ src: trigger.dataset.zoomSrc, alt: trigger.dataset.zoomAlt ?? "" }));
  });
}
