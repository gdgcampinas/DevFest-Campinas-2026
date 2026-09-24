/**
 * Modal genérico: único lugar com a estrutura (fundo, cartão, botão de
 * fechar) e o comportamento (fechar por X, fundo e Esc, travar o scroll).
 * Quem precisa de um modal (palestra, guia de instalação) chama
 * createModal(id) e abre com openHTML(html); o conteúdo é de quem chama.
 */
function createModal(id, { label = "" } = {}) {
  const modalEl = document.createElement("div");
  modalEl.className = "modal";
  modalEl.id = id;
  modalEl.hidden = true;
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  if (label) modalEl.setAttribute("aria-label", label);
  modalEl.innerHTML = `<div class="modal-backdrop"></div>
    <div class="modal-card">
      <button class="modal-close" aria-label="${t("common.close", "Fechar")}">✕</button>
      <div class="modal-content"></div>
    </div>`;
  document.body.appendChild(modalEl);
  const contentEl = modalEl.querySelector(".modal-content");

  function openHTML(html) {
    contentEl.innerHTML = html;
    modalEl.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function close() {
    modalEl.hidden = true;
    document.body.style.overflow = "";
  }

  modalEl.addEventListener("click", event => {
    if (event.target.closest(".modal-close") || event.target.classList.contains("modal-backdrop")) close();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modalEl.hidden) close();
  });

  return { el: modalEl, openHTML, close };
}
