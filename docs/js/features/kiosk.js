/**
 * Modo quiosque: o computador do telão não tem ninguém por perto. Esconde o cursor, bloqueia o menu do botão direito e pede ao navegador pra
 * NÃO apagar a tela (Wake Lock), pedindo de novo sempre que a trava cair (a aba ficou oculta, o sistema soltou). `ensure()` é chamado de tempos em
 * tempos pelo mural pra garantir a trava. Tudo injetável (documento, navigator), então o teste roda sem navegador de verdade.
 */
function createKiosk({ doc = document, nav = navigator, hiddenCursorClass = "kiosk" } = {}) {
  let lock = null;
  let active = false;

  async function ensure() {
    if (!active || lock || doc.visibilityState === "hidden" || !nav.wakeLock) return Boolean(lock);
    try {
      lock = await nav.wakeLock.request("screen");
      lock.addEventListener?.("release", () => { lock = null; });
    } catch {
      lock = null; // sem permissão ou bateria baixa: tenta de novo na próxima
    }
    return Boolean(lock);
  }

  return {
    start() {
      active = true;
      doc.documentElement.classList.add(hiddenCursorClass);
      doc.addEventListener("contextmenu", event => event.preventDefault());
      doc.addEventListener("visibilitychange", () => ensure());
      return ensure();
    },
    ensure,
    isLocked: () => Boolean(lock),
  };
}
