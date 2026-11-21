/**
 * Feature: clicar numa foto abre ela grande num modal, com setas (e teclado) pra passar pras vizinhas. Serve a qualquer galeria: `initLightbox(rootEl, { selector, createModal, text, describe })`.
 *   selector     quais <img> dentro de `rootEl` abrem a foto grande (as escondidas por filtro, dentro de [hidden], ficam fora do passa-passa)
 *   createModal  o modal genérico (components/modal.js), injetado    |  text  rótulos { label, prev, next }
 *   describe     (img) => { title, caption } a legenda de cada foto (padrão: o texto alternativo)
 * `nextLightboxIndex(index, step, total)` é a regra pura do passa-passa (volta ao começo no fim e ao fim no começo). Devolve `{ open }`.
 */
function nextLightboxIndex(index, step, total) {
  return (((index + step) % total) + total) % total;
}

function initLightbox(rootEl, { selector, createModal, text, describe = img => ({ caption: img.alt }) }) {
  let modal = null;
  let items = [];
  let index = 0;
  const ensureModal = () => modal ?? (modal = createModal("lightboxModal", { label: text.label }));
  const show = next => {
    index = nextLightboxIndex(next, 0, items.length);
    const img = items[index];
    ensureModal().el.classList.add("lightbox");
    modal.openHTML(lightboxMarkup({ src: img.currentSrc || img.src, alt: img.alt, ...describe(img), hasNav: items.length > 1, text }));
  };

  rootEl.addEventListener("click", event => {
    const img = event.target.closest(selector);
    if (!img) return;
    items = Array.from(rootEl.querySelectorAll(selector)).filter(item => !item.closest("[hidden]"));
    show(items.indexOf(img));
  });
  document.addEventListener("click", event => {
    const step = event.target.closest("[data-lightbox-step]");
    if (step && modal && !modal.el.hidden) show(nextLightboxIndex(index, Number(step.dataset.lightboxStep), items.length));
  });
  document.addEventListener("keydown", event => {
    if (!modal || modal.el.hidden || items.length < 2) return;
    if (event.key === "ArrowLeft") show(nextLightboxIndex(index, -1, items.length));
    if (event.key === "ArrowRight") show(nextLightboxIndex(index, 1, items.length));
  });
  return { open: show };
}

if (typeof module !== "undefined") module.exports = { nextLightboxIndex };
