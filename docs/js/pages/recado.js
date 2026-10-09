/**
 * Página: enviar RECADO pro telão (recado.html, o QR do mural leva aqui; fora do menu e do sitemap). Raiz de composição: só liga as peças (repository da plateia, regras puras, login anônimo, frases).
 */
function initRecadoPage() {
  const text = wallTextsRepository.getAll();
  document.getElementById("wallMascot").innerHTML = mascotMarkup("wall-head-mascot");
  document.getElementById("wallLogo").innerHTML = logoMarkup("wall-logo");
  document.getElementById("wallTitle").textContent = text.title;
  document.getElementById("wallIntro").textContent = text.intro;
  initWallSubmit(document.getElementById("wallBody"), {
    repository: window.wallRepository,
    config: wallConfigRepository.getAll(),
    rules: { validateWallPost, nextWallSlot, wallEntry },
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
    text,
  });
}

runAfterModules(initRecadoPage);
