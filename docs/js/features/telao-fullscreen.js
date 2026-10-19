/**
 * Entrada em TELA CHEIA do telão. O Chrome só aceita tela cheia depois de um gesto de uma pessoa (clique ou tecla), então esta é a RESERVA para quando o telão abre em janela comum (o jeito certo é o
 * Chrome iniciado com `--kiosk`, que já abre em tela cheia: DevFestIA/tools/telao/iniciar-telao.bat). Enquanto não está em tela cheia mostra uma dica discreta; o primeiro clique ou a tecla F entra em
 * tela cheia e a dica some (também some sozinha se o Chrome já está em tela cheia/quiosque). Tudo injetável (documento, janela, texto da dica), então o teste roda sem navegador de verdade.
 * `isFullscreen()` vale pra tela cheia pela API e pra janela do tamanho da tela inteira (quiosque). Devolve `{ start, isFullscreen }`.
 */
function createTelaoFullscreen({ doc = document, win = window, hintText = "", hintClass = "telao-fs-hint" } = {}) {
  let hintEl = null;

  const isFullscreen = () => Boolean(doc.fullscreenElement)
    || Boolean(win.matchMedia?.("(display-mode: fullscreen)").matches)
    || (win.innerWidth >= win.screen.width && win.innerHeight >= win.screen.height);

  const syncHint = () => { if (hintEl) hintEl.hidden = isFullscreen(); };

  async function enter() {
    if (isFullscreen() || typeof doc.documentElement.requestFullscreen !== "function") return false;
    try {
      await doc.documentElement.requestFullscreen();
      return true;
    } catch {
      return false; // o navegador recusou (sem gesto válido): a dica continua
    }
  }

  return {
    start() {
      if (hintText) {
        hintEl = doc.createElement("div");
        hintEl.className = hintClass;
        hintEl.textContent = hintText;
        doc.body.appendChild(hintEl);
      }
      doc.addEventListener("click", enter);
      doc.addEventListener("keydown", event => { if (event.key === "f" || event.key === "F") enter(); });
      doc.addEventListener("fullscreenchange", syncHint);
      win.addEventListener("resize", syncHint);
      syncHint();
    },
    isFullscreen,
  };
}
