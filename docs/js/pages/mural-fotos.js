/**
 * Página: moderação das FOTOS do mural (ferramenta interna, fora do nav/sitemap, sem versão /DEV/). `?album=<id>` escolhe o álbum (padrão: o ao vivo); `?albuns=<endereço>` liga o
 * intermediário só pra teste (como no mural). Raiz de composição: só liga as peças.
 */
function initMuralFotosPage() {
  const params = new URLSearchParams(location.search);
  const config = muralConfigRepository.getAll();
  const proxyParam = params.get("albuns");
  const proxyUrl = /^https?:\/\//.test(proxyParam ?? "") ? proxyParam : config.albums.proxyUrl;
  const bodyEl = document.getElementById("modBody");
  const album = muralAlbumsRepository.get(params.get("album") ?? "ao-vivo");
  if (!album || !proxyUrl) {
    bodyEl.innerHTML = `<p class="mod-hint">${album ? "O intermediário de álbuns ainda não está ligado (MURAL_CONFIG.albums.proxyUrl)." : `Álbum desconhecido. Use <code>?album=</code> com um destes: ${muralAlbumsRepository.getAll().map(item => item.id).join(", ")}.`}</p>`;
    return;
  }
  initMuralPhotoModeration(bodyEl, {
    album,
    albumsRepository: createAlbumsRepository({ baseUrl: proxyUrl, storage: null, timeoutMs: config.albums.timeoutMs, schedule: defaultSchedule }),
    hiddenRepository: window.moderationMuralHiddenRepository,
    formatTime: photo => (photo.addedAt ? formatEventTime(new Date(photo.addedAt), EVENT.timezone) : ""),
  });
}

runAfterModules(initMuralFotosPage);
