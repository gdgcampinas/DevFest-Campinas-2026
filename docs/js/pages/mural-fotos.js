/**
 * Página: moderação das FOTOS do mural (ferramenta interna, fora do nav/sitemap, sem versão /DEV/). `?album=<id>` escolhe o álbum (padrão: o ao vivo); `?albuns=<endereço>` liga o
 * intermediário só pra teste (como no mural). Raiz de composição: só liga as peças. A mesma tela mora na área de admin (seção Fotos).
 */
function initMuralFotosPage() {
  mountAdminNav();
  const params = new URLSearchParams(location.search);
  const config = muralConfigRepository.getAll();
  const proxyParam = params.get("albuns");
  mountMuralPhotoModeration(document.getElementById("modBody"), {
    album: muralAlbumsRepository.get(params.get("album") ?? "ao-vivo"),
    proxyUrl: /^https?:\/\//.test(proxyParam ?? "") ? proxyParam : config.albums.proxyUrl,
    albumIds: muralAlbumsRepository.getAll().map(item => item.id),
    timeoutMs: config.albums.timeoutMs,
  });
}

runAfterModules(initMuralFotosPage);
