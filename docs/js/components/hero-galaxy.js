/** Camada decorativa (só template): imagem girando, sem função pra leitor de tela. Os valores viram variáveis CSS. */
function heroGalaxyMarkup({ src, rotationSeconds, opacity, size, x, y }) {
  return `<div class="hero-galaxy" aria-hidden="true" style="--galaxy-duration:${rotationSeconds}s;--galaxy-opacity:${opacity};--galaxy-size:${size};--galaxy-x:${x};--galaxy-y:${y}">
    <img src="${src}" alt="" decoding="async">
  </div>`;
}
