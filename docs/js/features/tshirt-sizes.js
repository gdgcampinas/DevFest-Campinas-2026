/**
 * Feature: o guia de tamanhos da camiseta na página de ingressos. `initTshirtSizes(sectionEl, { models, text, config, devMode, doc })` mostra o guia (só em DEV até `config.public`, ver features/release-gate.js),
 * troca de aba ao clicar, rola até ele quando clicam num atalho `[data-tshirt-sizes-link]` e devolve se ficou visível. A rolagem é feita aqui (e não só pelo `#tamanhos` do link) porque na versão
 * /DEV/ o `<base href="../">` faria o link `#tamanhos` abrir a página principal. Tudo por parâmetro.
 */
function initTshirtSizes(sectionEl, { models, text, config, devMode = false, doc = document }) {
  const visible = isReleased(config, { devMode });
  sectionEl.hidden = !visible;
  if (!visible || !sectionEl) return false;
  const draw = activeId => { sectionEl.innerHTML = tshirtSizesMarkup({ models, text, activeId }); };
  sectionEl.addEventListener("click", event => {
    const tab = event.target.closest("[data-sizes-model]");
    if (tab) draw(tab.dataset.sizesModel);
  });
  doc.addEventListener("click", event => {
    if (!event.target.closest("[data-tshirt-sizes-link]")) return;
    event.preventDefault();
    sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  draw(models[0].id);
  return true;
}
