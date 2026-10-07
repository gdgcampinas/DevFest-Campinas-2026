/**
 * Pré-carrega uma imagem ANTES de ela entrar numa cena: a cena nunca mostra imagem quebrada nem espera uma foto que não chega.
 * Resolve com a própria url quando carregou; rejeita se der erro ou passar de `timeoutMs` (404, rede muda). `createImage` e `schedule`
 * são injetáveis (no teste, imagem de mentira e relógio falso).
 */
function preloadImage(url, { timeoutMs, schedule = defaultSchedule, createImage = () => new Image() }) {
  return withTimeout(new Promise((resolve, reject) => {
    const image = createImage();
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error(`imagem não carregou: ${url}`));
    image.src = url;
  }), timeoutMs, schedule, `imagem demorou demais: ${url}`);
}
