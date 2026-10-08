/**
 * Cena de foto: uma foto grande de edições passadas por vez, a próxima da fila (features/mural-photo-pool.js). A foto é pré-carregada com tempo
 * limite ANTES de entrar; se não carrega vai de castigo e a próxima é tentada na mesma preparação, então nunca aparece imagem quebrada.
 * Só desiste (a cena falha e descansa) se nenhuma foto carregar. Cada foto ganha um zoom lento (efeito Ken Burns), por CSS, durante todo o tempo de tela:
 * `kenBurns` é a lista de movimentos (origem, escala inicial e final) que se alternam a cada foto, pra não repetir o mesmo.
 * Tudo injetado: `pool`, `preload` (features/image-preload.js), `caption`, `kenBurns` (MURAL_CONFIG.motion.kenBurns).
 */
function createPhotosScene({ pool, preload, caption, kenBurns = [] }) {
  const moves = createMoveCycle(kenBurns);
  return {
    async prepare() {
      for (let tries = Math.max(1, pool.usable()); tries > 0; tries--) {
        const photo = pool.next();
        if (!photo) break;
        try {
          await preload(photo.file);
          return photo;
        } catch {
          pool.reportFailure(photo);
        }
      }
      throw new Error("nenhuma foto carregou");
    },
    render(photo) {
      return { markup: muralPhotoMarkup({ url: photo.file, alt: photo.alt, captionMarkup: `<p class="ms-photo-caption">${escapeHtml(caption)}</p>`, moveStyle: moves.next() }) };
    },
  };
}
