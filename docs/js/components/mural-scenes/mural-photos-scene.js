/**
 * Cena de foto: uma foto grande de edições passadas por vez, a próxima da fila (features/mural-photo-pool.js). A foto é pré-carregada com tempo
 * limite ANTES de entrar; se não carrega vai de castigo e a próxima é tentada na mesma preparação, então nunca aparece imagem quebrada.
 * Só desiste (a cena falha e descansa) se nenhuma foto carregar. Tudo injetado: `pool`, `preload` (features/image-preload.js), `caption`.
 */
function createPhotosScene({ pool, preload, caption }) {
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
      const url = escapeHtml(photo.file);
      return { markup: `<section class="ms ms-photo"><div class="ms-photo-bg" style="background-image:url('${url}')"></div><img class="ms-photo-img" src="${url}" alt="${escapeHtml(photo.alt ?? "")}"><p class="ms-photo-caption">${escapeHtml(caption)}</p></section>` };
    },
  };
}
