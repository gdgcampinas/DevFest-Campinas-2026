/**
 * Feature: tela do moderador de FOTOS do mural (ferramenta interna, mural-fotos.html). Mostra as fotos mais novas de um álbum do Google Fotos (a lista vem do intermediário, relida de tempos em tempos)
 * e deixa o moderador "Tirar do ar" / "Voltar ao ar" com um toque: a escolha vira a lista de ids em `mural-hidden/<álbum>` (Firestore), que o mural escuta e aplica na hora. Só o e-mail Google da lista de
 * moderadores das regras consegue gravar; outra conta vê "sem permissão" (a regra é a defesa, a tela só avisa). Retoma o login que já estava feito.
 * Tudo por parâmetro: `album` (data/mural-albums.js), `albumsRepository` (lê a lista), `hiddenRepository` ({ listen, set }), `login` (defaultModeratorLoginDeps), `schedule`, `refreshMs`, `limit`.
 */
function initMuralPhotoModeration(rootEl, { album, albumsRepository, hiddenRepository, login = defaultModeratorLoginDeps(), schedule = defaultSchedule, refreshMs = 30000, limit = 60, formatTime = () => "", thumbSize = { width: 400, height: 400 }, whenReady = runAfterModules }) {
  let email = "";
  let photos = [];
  let hidden = new Set();
  let message = "";
  const pending = new Set();
  let cancelRefresh = () => {};
  let stopListening = () => {};
  let active = false;

  const draw = phase => {
    rootEl.innerHTML = muralPhotoModerationMarkup({ phase, email, albumLabel: album.label, message, photos: photos.slice(0, limit), hidden, pending, formatTime, thumbUrl: photo => albumPhotoUrl(photo, thumbSize) });
  };
  const drawReady = () => draw("ready");

  async function refresh() {
    if (!active) return;
    try {
      photos = (await albumsRepository.get(album.id)).photos;
      message = "";
    } catch {
      message = "Não consegui ler as fotos do álbum agora. Tentando de novo em instantes.";
    }
    if (!active) return;
    drawReady();
    cancelRefresh = schedule(refresh, refreshMs);
  }

  function start() {
    active = true;
    stopListening = hiddenRepository.listen(album.id, doc => { hidden = new Set(doc?.ids ?? []); if (active) drawReady(); }, () => {
      message = "Não consegui ler a lista de fotos fora do ar. Confira a conexão.";
      if (active) drawReady();
    });
    drawReady();
    refresh();
  }

  function stop() {
    active = false;
    cancelRefresh();
    stopListening();
  }

  async function toggle(photoId) {
    const next = new Set(hidden);
    if (next.has(photoId)) next.delete(photoId);
    else next.add(photoId);
    const previous = hidden;
    hidden = next; // atualiza na hora (dois toques seguidos já partem da lista nova); se o banco recusar, volta ao que era
    pending.add(photoId);
    drawReady();
    try {
      await hiddenRepository.set(album.id, { ids: [...next] });
      message = "";
    } catch (error) {
      if (hidden === next) hidden = previous;
      message = error?.code === "permission-denied" ? "Sem permissão: esta conta não é de moderador." : "Não consegui salvar. Tente de novo.";
    }
    pending.delete(photoId);
    if (active) drawReady();
  }

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await login.signIn();
        start();
      } catch (error) {
        message = signInErrorMessage(error);
        draw("signin");
      }
    } else if (event.target.closest("[data-mod-signout]")) {
      stop();
      await login.signOut();
      email = "";
      message = "";
      draw("signin");
    } else {
      const button = event.target.closest("[data-photo-toggle]");
      if (button && !pending.has(button.dataset.photoToggle)) toggle(button.dataset.photoToggle);
    }
  });

  draw("signin");
  whenReady(async () => {
    email = (await login.restore().catch(() => null)) ?? "";
    if (email) start();
  });
}
