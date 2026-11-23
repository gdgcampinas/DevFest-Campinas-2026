/**
 * Feature: tela do moderador de FOTOS do mural (ferramenta interna, mural-fotos.html). Mostra as fotos mais novas de um álbum do Google Fotos (a lista vem do intermediário, relida de tempos em tempos)
 * e deixa o moderador "Tirar do ar" / "Voltar ao ar" com um toque: a escolha vira a lista de ids em `mural-hidden/<álbum>` (Firestore), que o mural escuta e aplica na hora. Só o e-mail Google da lista de
 * moderadores das regras consegue gravar; outra conta vê "sem permissão" (a regra é a defesa, a tela só avisa). Retoma o login que já estava feito.
 * ÁLBUM COM APROVAÇÃO (`album.approval`, data/mural-albums.js): o contrário. A foto nova fica PENDENTE e só vai ao telão depois de "Aprovar" (lista de ids em `mural-approved/<álbum>`); "Recusar" e "Tirar do ar" escondem
 * (`mural-hidden`) e "Voltar ao ar" aprova de novo. Abas Pendentes, No ar e Fora do ar; "Aprovar todas as pendentes" aprova as pendentes que estão na tela.
 * Tudo por parâmetro: `album` (data/mural-albums.js), `albumsRepository` (lê a lista), `hiddenRepository` ({ listen, set }), `approvedRepository` (o mesmo contrato, só usado no álbum com aprovação), `login` (defaultModeratorLoginDeps), `schedule`, `refreshMs`, `limit`.
 * `embedded` (dentro da área de admin, que faz o login uma vez): sem porta de entrada, conta nem título; liga na hora, já logado. Devolve `{ stop }` (desliga a escuta e a releitura).
 */
function initMuralPhotoModeration(rootEl, { album, albumsRepository, hiddenRepository, approvedRepository = hiddenRepository, login = defaultModeratorLoginDeps(), access = { resolve: async () => ({}) }, accessText = {}, schedule = defaultSchedule, refreshMs = 30000, limit = 60, formatTime = () => "", thumbSize = { width: 400, height: 400 }, whenReady = runAfterModules, embedded = false }) {
  let email = "";
  let photos = [];
  let hidden = new Set();
  let approved = new Set();
  let approvedReady = !album.approval; // álbum com aprovação espera a lista de aprovadas chegar antes de mostrar as abas
  let tab = "pending";
  let message = "";
  const pending = new Set();
  let cancelRefresh = () => {};
  let stopListening = () => {};
  let stopListeningApproved = () => {};
  let active = false;

  const draw = phase => {
    rootEl.innerHTML = muralPhotoModerationMarkup({ phase, email, albumLabel: album.label, embedded, message, photos: photos.slice(0, limit), hidden, approved, approval: Boolean(album.approval), approvedReady, tab, pending, formatTime, thumbUrl: photo => albumPhotoUrl(photo, thumbSize) });
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

  /** Conta entrou: só segue se for moderadora (o painel embutido no admin já passou pela porta do admin). */
  async function enter() {
    const state = moderatorAccessState(await access.resolve());
    if (state === "allowed") return start();
    rootEl.innerHTML = moderatorBlockedMarkup({ state, email, text: accessText });
  }

  function start() {
    active = true;
    stopListening = hiddenRepository.listen(album.id, doc => { hidden = new Set(doc?.ids ?? []); if (active) drawReady(); }, () => {
      message = "Não consegui ler a lista de fotos fora do ar. Confira a conexão.";
      if (active) drawReady();
    });
    if (album.approval) {
      stopListeningApproved = approvedRepository.listen(album.id, doc => { approved = new Set(doc?.ids ?? []); approvedReady = true; if (active) drawReady(); }, () => {
        message = "Não consegui ler a lista de fotos aprovadas. Confira a conexão.";
        if (active) drawReady();
      });
    }
    drawReady();
    refresh();
  }

  function stop() {
    active = false;
    cancelRefresh();
    stopListening();
    stopListeningApproved();
  }

  /** Grava as listas que mudaram (`changes`: { hidden?: Set, approved?: Set }). A tela já mostra a lista nova (dois toques seguidos partem dela); se o banco recusar, volta ao que era. */
  async function save(photoIds, changes) {
    const previous = { hidden, approved };
    if (changes.hidden) hidden = changes.hidden;
    if (changes.approved) approved = changes.approved;
    photoIds.forEach(id => pending.add(id));
    drawReady();
    try {
      if (changes.approved) await approvedRepository.set(album.id, { ids: [...changes.approved] });
      if (changes.hidden) await hiddenRepository.set(album.id, { ids: [...changes.hidden] });
      message = "";
    } catch (error) {
      if (changes.hidden && hidden === changes.hidden) hidden = previous.hidden;
      if (changes.approved && approved === changes.approved) approved = previous.approved;
      message = error?.code === "permission-denied" ? "Sem permissão: esta conta não é de moderador." : "Não consegui salvar. Tente de novo.";
    }
    photoIds.forEach(id => pending.delete(id));
    if (active) drawReady();
  }

  const withId = (set, id) => new Set(set).add(id);
  const withoutId = (set, id) => { const next = new Set(set); next.delete(id); return next; };
  /** Aprovar: entra na lista de aprovadas e, se estava escondida, sai da de escondidas (Voltar ao ar). */
  const approve = ids => save(ids, { approved: new Set([...approved, ...ids]), ...(ids.some(id => hidden.has(id)) ? { hidden: new Set([...hidden].filter(id => !ids.includes(id))) } : {}) });

  const toggle = photoId => save([photoId], { hidden: hidden.has(photoId) ? withoutId(hidden, photoId) : withId(hidden, photoId) });

  const ACTIONS = {
    "photo-toggle": toggle,
    "photo-approve": id => approve([id]),
    "photo-restore": id => approve([id]),
    "photo-reject": id => save([id], { hidden: withId(hidden, id) }),
    "photo-takedown": id => save([id], { hidden: withId(hidden, id) }),
  };

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await login.signIn();
        await enter();
      } catch (error) {
        message = signInErrorMessage(error);
        draw("signin");
      }
    } else if (event.target.closest("[data-mod-retry]")) {
      await enter();
    } else if (event.target.closest("[data-mod-signout]")) {
      stop();
      await login.signOut();
      email = "";
      message = "";
      draw("signin");
    } else if (event.target.closest("[data-approve-all]")) {
      const ids = photoApprovalGroups({ photos: photos.slice(0, limit), approved, hidden }).pending.map(photo => photo.id).filter(id => !pending.has(id));
      if (ids.length) approve(ids);
    } else if (event.target.closest("[data-mod-tab]")) {
      tab = event.target.closest("[data-mod-tab]").dataset.modTab;
      drawReady();
    } else {
      const button = event.target.closest("[data-photo-toggle], [data-photo-approve], [data-photo-restore], [data-photo-reject], [data-photo-takedown]");
      const action = Object.keys(ACTIONS).find(name => button?.hasAttribute(`data-${name}`));
      if (action && !pending.has(button.getAttribute(`data-${action}`))) ACTIONS[action](button.getAttribute(`data-${action}`));
    }
  });

  if (embedded) {
    start();
  } else {
    draw("signin");
    whenReady(async () => {
      email = (await login.restore().catch(() => null)) ?? "";
      if (email) await enter();
    });
  }
  return { stop };
}

/**
 * Liga a moderação de fotos a um álbum e ao intermediário de álbuns (ou mostra por que não dá): o que mural-fotos.html e a seção Fotos da área de admin usam, pra não repetir a montagem.
 * Tudo por parâmetro: `album` (data/mural-albums.js, ou null), `proxyUrl` (endereço do intermediário, vazio = desligado), `albumIds` (pra listar na mensagem de álbum desconhecido), `timeoutMs`,
 * `embedded`, `hiddenRepository` e `formatTime` (padrões do site). Devolve `{ stop }`.
 */
function mountMuralPhotoModeration(rootEl, { album, proxyUrl, albumIds = [], timeoutMs, embedded = false, hiddenRepository = window.moderationMuralHiddenRepository, approvedRepository = window.moderationMuralApprovedRepository, formatTime = photo => (photo.addedAt ? formatEventTime(new Date(photo.addedAt), EVENT.timezone) : "") }) {
  if (!album || !proxyUrl) {
    rootEl.innerHTML = muralPhotoModerationUnavailableMarkup({ hasAlbum: Boolean(album), albumIds });
    return { stop: () => {} };
  }
  return initMuralPhotoModeration(rootEl, {
    album,
    albumsRepository: createModerationAlbumsRepository({ proxyUrl, timeoutMs }),
    hiddenRepository,
    approvedRepository,
    formatTime,
    embedded,
    ...defaultModeratorAccessDeps(),
  });
}

/** O leitor de álbuns do moderador: sempre fresco (sem guardar a última lista no navegador, o moderador precisa ver o que está no álbum AGORA). Usado pela tela de fotos e pela visão geral do admin. */
function createModerationAlbumsRepository({ proxyUrl, timeoutMs }) {
  return createAlbumsRepository({ baseUrl: proxyUrl, storage: null, timeoutMs, schedule: defaultSchedule });
}
