/**
 * Feature: fundo estrelado + circuito, atrás de todo o conteúdo. Injeta
 * os elementos uma vez (nenhuma página tem esse HTML no próprio arquivo,
 * mesmo padrão de outras camadas globais como o rodapé e o nav). Estrelas
 * tremeluzem via CSS; a regra global de prefers-reduced-motion (styles.css)
 * já zera a animação pra quem pede menos movimento, sem código extra aqui.
 */
function initStarfield(rootEl, { layers, circuitSrc }) {
  const bgEl = document.createElement("div");
  bgEl.className = "site-bg";
  bgEl.setAttribute("aria-hidden", "true");

  bgEl.insertAdjacentHTML("beforeend", `<img class="bg-circuit" src="${circuitSrc}" alt="">`);
  layers.forEach(layer => {
    const starsEl = document.createElement("div");
    starsEl.className = `bg-stars ${layer.className}`;
    starsEl.style.width = layer.size;
    starsEl.style.height = layer.size;
    starsEl.style.boxShadow = layer.shadows;
    bgEl.appendChild(starsEl);
  });

  rootEl.prepend(bgEl);
}
