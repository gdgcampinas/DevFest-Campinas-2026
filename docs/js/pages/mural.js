/**
 * Página: MURAL DO TELÃO (mural.html), ferramenta interna (fora do menu e do sitemap, sem versão /DEV/: abra na raiz, `?lineup=1` mostra o mock).
 * É a RAIZ DE COMPOSIÇÃO: aqui, e só aqui, as peças soltas (motor, vigia, rede, fontes ao vivo, cenas, palco) são ligadas, cada uma recebendo o que precisa
 * por parâmetro. Nada de regra de negócio neste arquivo.
 *
 * Roda num computador plugado no telão, sem ninguém operando. Parâmetros de URL (todos opcionais, pro ensaio e teste):
 *   ?tela=1920x1080  ?proporcao=3:1  ?margem=2   simulam o telão e a margem segura (features/mural-stage.js)
 *   ?cenas=agora,fotos-1                          só essas cenas, na ordem pedida
 *   ?diag=1                                       painel de saúde (cena, falhas, rede, fontes, recargas)
 *   ?lineup=1 | ?demo=AAAA-MM-DDTHH:MM | ?ensaio=HH:MM   os mesmos modos de teste do resto do site (app.js)
 */
function initMural() {
  window.__muralBooted = true;
  const config = muralConfigRepository.getAll();
  const params = new URLSearchParams(location.search);
  const rehearsal = setupRehearsal();
  const reveal = resolveReveal();
  const clock = resolveNow();
  const schedule = defaultSchedule;
  const nowMs = () => Date.now();
  const year = EVENT.date.slice(0, 4);
  const title = `${EVENT.name} ${year}`;
  const proxyParam = params.get("albuns");
  const proxyUrl = /^https?:\/\//.test(proxyParam ?? "") ? proxyParam : config.albums.proxyUrl;
  const logoSrc = EVENT.hosts[0].logo ?? EVENT.hosts[0].icon;
  const stageEl = document.getElementById("muralStage");
  const contentEl = document.getElementById("muralContent");
  const footerEl = document.getElementById("muralFooter");
  const diagEl = document.getElementById("muralDiag");

  // ---------- palco ----------
  const spec = parseStageSpec(location.search, config.stage);
  const stage = mountStage({ stageEl, spec, shapes: config.stage.shapes });
  stage.apply();
  stageEl.style.setProperty("--stagger-step", `${config.motion.staggerMs}ms`);
  stageEl.style.setProperty("--reveal-step", `${config.motion.podiumStepMs}ms`);
  const diagOn = params.get("diag") === "1";
  if (spec.mode === "fill" && !diagOn) {
    const kiosk = createKiosk(); // telão de verdade: sem cursor e sem tela apagando (na simulação e no diagnóstico o cursor fica)
    kiosk.start();
    scheduleEvery(schedule, config.kioskEnsureEveryMs, () => kiosk.ensure());
  }

  // ---------- estado compartilhado ----------
  const live = {}; // último dado de cada fonte ao vivo, lido pelas cenas (ctx.live)
  const pending = new Set(); // motivos de recarga que esperam a próxima troca de cena
  let degraded = false;
  let watchdog = null;
  let hub = null;
  const ledger = createReloadLedger({ storage: safeSessionStorage() });

  // ---------- rede ----------
  const network = createNetworkMonitor({
    win: window, nowMs, schedule, config: config.network,
    probe: createFetchProbe({ url: config.network.probeUrl, timeoutMs: config.network.probeTimeoutMs, schedule }),
    onChange: state => {
      if (!state.online) return;
      hub?.reconnectAll(); // a internet voltou: reabre as escutas já, sem esperar a espera crescente
      if (state.lastOutageMs >= config.health.offlineReloadAfterMs) pending.add("offline-recovery");
    },
  });

  // ---------- álbuns do Google Fotos (sem o intermediário ligado não há o que ler: nenhuma fonte, nenhuma cena de álbum) ----------
  const albumsRepository = createAlbumsRepository({ baseUrl: proxyUrl, storage: safeLocalStorage(), timeoutMs: config.albums.timeoutMs, schedule });
  const albumKeys = live => (proxyUrl ? muralAlbumsRepository.enabled({ live }).map(album => ({ key: album.id, intervalMs: album.pollMs })) : []);

  // ---------- cenas ----------
  const preload = url => preloadImage(url, { timeoutMs: config.imageTimeoutMs, schedule });
  const talkIndex = buildTalkIndex(SCHEDULE, TRACKS, EVENT.timezone);
  const grid = { schedule: SCHEDULE, tracks: TRACKS, timezone: EVENT.timezone, phaseOf: resolveEventState };
  const highlights = highlightsRepository.getAll();
  const registry = {
    "now-next": createNowNextScene(grid),
    album: createAlbumScene({
      albums: muralAlbumsRepository, models: muralAlbumModelsRepository.getAll(), autoRules: muralAlbumModelsRepository.auto(), preload, orderPhotos: orderAlbumPhotos,
      createPool: photos => createPhotoPool({ photos, nowMs, quarantineMs: config.albums.quarantineMs, keyOf: photo => photo.id }),
      renderers: {
        single: createSingleAlbumModel({ moves: createMoveCycle(config.motion.kenBurns) }),
        collage: albumCollageModel,
        "portrait-strip": albumPortraitStripModel,
        polaroid: createPolaroidAlbumModel({ rotations: muralAlbumModelsRepository.getAll().polaroid.rotations }),
        feature: albumFeatureModel,
      },
    }),
    spotlight: createSpotlightScene({ ...grid, preloadPhoto: url => preloadImage(url, { timeoutMs: config.speakerPhotoTimeoutMs, schedule }), hostOf: id => talkHighlightsRepository.getById(id)?.host ?? null }),
    art: createArtScene({ repository: muralArtsRepository, preload }),
    selfie: createSelfieScene({ preload, arts: muralArtsRepository, mascotUrl: "assets/img/gumbleton.png", logoSrc, title, subtitle: eventDateLabel(SCHEDULE, EVENT.timezone) }),
    photos: createPhotosScene({ pool: createPhotoPool({ photos: highlights.photos, nowMs, quarantineMs: config.photoQuarantineMs }), preload, caption: highlights.title, kenBurns: config.motion.kenBurns }),
    sponsors: createSponsorsScene({ repository: sponsorsRepository, preload }),
    qr: createQrScene({ siteUrl: EVENT.url, extraQuery: () => rehearsal.query, qr: createQrRenderer() }),
    registered: createRegisteredScene({ motion: config.motion }),
    tips: createTipsScene({ repository: muralTipsRepository }),
    phoenix: createPhoenixScene({ preload, imageUrl: "assets/img/gumbleton.png", title, subtitle: eventDateLabel(SCHEDULE, EVENT.timezone) }),
    podium: createPodiumScene({ talkIndex, highlightOf: talkHighlightsRepository.forTalk }),
    "event-phase": createEventPhaseScene({ schedule: SCHEDULE, title }),
    reserve: createReserveScene({ logoSrc, title, subtitle: eventDateLabel(SCHEDULE, EVENT.timezone), ...grid }),
  };

  // ---------- motor ----------
  const mural = createMural({
    contentEl, registry, config, schedule, nowMs, ledger,
    scenes: filterScenesByIds(muralScenesRepository.getAll(), (params.get("cenas") ?? "").split(",").filter(Boolean)),
    reserveScene: muralScenesRepository.reserve(),
    emergencyMarkup: `<section class="ms ms-reserve"><h2 class="ms-title">${escapeHtml(title)}</h2></section>`,
    sceneDeps: { schedule, clock },
    getContext: () => ({ now: clock(), reveal, phase: resolveEventState(clock(), SCHEDULE).phase, live, network: network.state() }),
    onBoundary: () => watchdog.check({ atBoundary: true }).action === "reload",
    onSceneChange: () => contentEl.querySelector('[data-scene="boot"]')?.remove(),
    onFailure: (scene, error) => console.warn(`[mural] cena ${scene.id} falhou:`, error),
  });

  // ---------- vigia ----------
  watchdog = createWatchdog({
    ticker: createIndependentTicker({ intervalMs: config.health.checkEveryMs }),
    snapshot: () => ({ ...mural.state(), pending: [...pending] }),
    config: config.health, ledger, nowMs,
    reload: () => location.reload(),
    onDecision: decision => { degraded = decision.degraded; },
  });
  window.addEventListener("error", event => mural.reportError(event.error ?? new Error(event.message)));
  window.addEventListener("unhandledrejection", event => mural.reportError(event.reason ?? new Error("promise rejeitada")));

  // ---------- versão nova publicada ----------
  const versionChecker = createVersionChecker({
    fetchText: () => fetch(`${location.pathname}?versao=${Date.now()}`, { cache: "no-store" }).then(response => (response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))),
    onChange: () => pending.add("version"),
  });

  // ---------- fontes ao vivo ----------
  const bindings = createLiveBindings({
    definitions: muralSourcesRepository.getAll(), live, mural, schedule, nowMs,
    celebrate: () => createConfetti().fire({ origin: { x: window.innerWidth / 2, y: window.innerHeight / 2 }, force: true }),
  });
  runAfterModules(() => {
    hub = createLiveHub({
      schedule, nowMs, backoff: config.network.backoff, onUpdate: bindings,
      sources: buildLiveSources({
        definitions: muralSourcesRepository.getAll(), schedule,
        repositories: { eventStats: () => window.eventStatsRepository, contestResults: () => window.contestResultsRepository, albums: () => albumsRepository },
        keyResolvers: {
          "live-albums": () => albumKeys(true),
          "other-albums": () => albumKeys(false), "contest-sessions": () => talkIndex.getAll().filter(entry => talkHighlightsRepository.hasContest(entry.data)).map(entry => entry.key) },
        getUid: () => window.firebaseClient.ensureAnonymousUid(),
      }),
    });
    hub.start();
  });

  // ---------- rodapé, painel de diagnóstico e partida ----------
  footerEl.innerHTML = muralFooterMarkup({ logoSrc, name: title });
  scheduleEvery(schedule, config.clockEveryMs, () => {
    updateMuralFooter(footerEl, { time: formatEventTime(clock(), EVENT.timezone), online: network.state().online });
    if (diagOn) renderDiag();
  });
  scheduleEvery(schedule, config.health.versionCheckEveryMs, () => versionChecker.check());
  if (diagOn) diagEl.hidden = false;

  function renderDiag() {
    const state = mural.state();
    const net = network.state();
    diagEl.innerHTML = muralDiagMarkup({
      scene: state.current?.id, sceneSeconds: state.current ? Math.round((nowMs() - state.current.startedAt) / 1000) : 0,
      shown: state.shown, failures: state.failures, cooling: state.cooling, lastError: state.lastError,
      online: net.online, offlineFor: net.offlineSince ? Math.round((nowMs() - net.offlineSince) / 1000) : 0,
      sources: hub?.statuses() ?? {}, uptimeMin: Math.round((nowMs() - state.startedAt) / 60000),
      reloads: ledger.recentReloads().filter(time => nowMs() - time < config.health.reloadStormWindowMs).length,
      pending: [...pending], degraded, stage: stageEl.dataset.size,
    });
  }

  network.start();
  watchdog.start();
  mural.start();
}

/** localStorage (a última lista boa de cada álbum sobrevive a recarregar a página), ou null quando o navegador bloqueia. */
function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** sessionStorage, ou null quando o navegador bloqueia (o ledger então guarda só em memória). */
function safeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

initMural();
