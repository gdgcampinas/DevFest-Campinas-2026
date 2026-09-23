/** Camada decorativa (só template): imagem girando, sem função pra leitor de tela. Os valores viram variáveis CSS. */
function heroGalaxyMarkup({ src, rotationSeconds, reducedMotionSeconds = null, opacity, size, maxWidth, x, y, pivotX, pivotY }) {
  const still = reducedMotionSeconds === null ? " hero-galaxy--still" : "";
  const reduced = reducedMotionSeconds === null ? "" : `--galaxy-duration-reduced:${reducedMotionSeconds}s;`;
  return `<div class="hero-galaxy${still}" aria-hidden="true" style="--galaxy-duration:${rotationSeconds}s;${reduced}--galaxy-opacity:${opacity};--galaxy-size:${size};--galaxy-max:${maxWidth};--galaxy-x:${x};--galaxy-y:${y};--galaxy-pivot-x:${pivotX};--galaxy-pivot-y:${pivotY}">
    <img src="${src}" alt="" decoding="async">
  </div>`;
}
