/**
 * Feature: a galeria da camiseta do kit. `nextTshirtView(view, change)` é a regra pura (troca de modelo e de lado sem perder o outro); `initTshirtGallery(rootEl, { createModal, models, text })` abre o modal
 * ao clicar em `[data-tshirt-open]` e redesenha a cada troca. Tudo por parâmetro (o modal e os dados vêm de fora). Devolve `{ open }`.
 */
function nextTshirtView(view, { modelId, side }) {
  return { modelId: modelId ?? view.modelId, side: side ?? view.side };
}

function initTshirtGallery(rootEl, { createModal, models, text, sizesLinkHtml = "" }) {
  let modal = null;
  let view = { modelId: models[0].id, side: "frente" };
  const ensureModal = () => modal ?? (modal = createModal("tshirtModal", { label: text.modalLabel }));
  const draw = () => ensureModal().openHTML(tshirtGalleryMarkup({ models, text, view, sizesLinkHtml }));

  document.addEventListener("click", event => {
    if (event.target.closest("[data-tshirt-open]")) return draw();
    const modalEl = event.target.closest("#tshirtModal");
    if (!modalEl || modalEl.hidden) return;
    if (event.target.closest("[data-tshirt-sizes-link]")) return modal.close(); // fecha a galeria; o link leva ao guia de tamanhos
    const modelButton = event.target.closest("[data-tshirt-model]");
    const sideButton = event.target.closest("[data-tshirt-side]");
    if (modelButton) view = nextTshirtView(view, { modelId: modelButton.dataset.tshirtModel });
    else if (sideButton) view = nextTshirtView(view, { side: sideButton.dataset.tshirtSide });
    else return;
    draw();
  });
  return { open: draw };
}

if (typeof module !== "undefined") module.exports = { nextTshirtView };
