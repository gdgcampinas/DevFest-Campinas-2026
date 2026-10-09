/**
 * Página: RECADOS NO TELÃO (recado.html, no menu do site e no QR do telão): a plateia escolhe uma pergunta, escreve em uma frase e o recado vai pro moderador aprovar. Vale só dentro da janela do
 * evento (data/wall-config.js `window`, das 08:00 às 17:30): antes diz quando abre, depois diz que encerrou. Raiz de composição: só liga as peças (casca do site, repository da plateia, regras puras,
 * login anônimo, frases e a janela). `?demo=` e `?ensaio=` valem como no resto do site (a janela olha o relógio simulado).
 */
function initRecadoPage() {
  initShell("recados");
  const text = wallTextsRepository.getAll();
  const config = wallConfigRepository.getAll();
  const now = resolveNow();
  const hour = iso => formatEventTime(new Date(iso), EVENT.timezone, CODE_LOCALE);
  document.getElementById("wallMascot").innerHTML = mascotMarkup("wall-head-mascot");
  document.getElementById("wallLogo").innerHTML = logoMarkup("wall-logo");
  document.getElementById("wallTitle").textContent = text.title;
  document.getElementById("wallIntro").textContent = text.intro;
  initWallSubmit(document.getElementById("wallBody"), {
    repository: window.wallRepository,
    config,
    rules: { validateWallPost, nextWallSlot, wallEntry },
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
    text,
    phaseOf: () => wallPhase(now(), config),
    hours: { from: hour(config.window.from), until: hour(config.window.until) },
  });
}

initRecadoPage();
