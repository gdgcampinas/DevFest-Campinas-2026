/**
 * Feature: o guia de tamanhos da camiseta na página de ingressos. `initTshirtSizes(sectionEl, { models, text, config, devMode })` mostra o guia (só em DEV até `config.public`, ver features/release-gate.js),
 * troca de aba ao clicar e devolve se ficou visível. Tudo por parâmetro.
 */
function initTshirtSizes(sectionEl, { models, text, config, devMode = false }) {
  const visible = isReleased(config, { devMode });
  sectionEl.hidden = !visible;
  if (!visible || !sectionEl) return false;
  const draw = activeId => { sectionEl.innerHTML = tshirtSizesMarkup({ models, text, activeId }); };
  sectionEl.addEventListener("click", event => {
    const tab = event.target.closest("[data-sizes-model]");
    if (tab) draw(tab.dataset.sizesModel);
  });
  draw(models[0].id);
  return true;
}
