/**
 * Feature: roleta do sorteio (área da organização, dentro da aba Sorteio). Só quem loga como moderador
 * (window.moderatorClient, mesma conta da moderação de perguntas — login/erro reusados de
 * features/moderator-login.js e components/moderator-login.js) vê e gira. A lista de quem pode ser sorteado
 * é TODO MUNDO que se cadastrou (raffle-entries), menos quem já ganhou (raffle-draws) — pool ao vivo por
 * listener, sem precisar recarregar a página se alguém se cadastrar durante o evento.
 *
 * Cada prêmio é um documento em raffle-draws cujo id É o id do cadastro sorteado (ver
 * data/moderation-repositories.js/firestore.rules): a mesma pessoa nunca pode ser sorteada 2x, a regra do
 * Firestore recusa como "já existe" — mesmo truque de dedupe dos check-ins, não uma checagem no cliente.
 *
 * `devSeed` (opcional, injetado por quem chama — pages/sorteio.js só passa algo quando `reveal` é true):
 * lista de teste (ex.: a página Time) usada SÓ quando ainda não tem ninguém cadastrado de verdade, pra dar
 * pra testar a roleta girando sem esperar o evento. Nunca grava no Firestore — o sorteio fica só na memória
 * da tela (`devDraws`) e some se a página recarregar. Assim que a 1ª pessoa de verdade se cadastra, a lista
 * real assume sozinha.
 *
 * Um erro ao carregar (`loadError`) NUNCA esconde a roleta — vira um aviso pequeno por cima; a roleta
 * continua desenhada mesmo com 0 pessoas (assim o moderador já vê a tela pronta antes de qualquer cadastro).
 *
 * Som: sintetizado (Web Audio), sem arquivo externo; as notas são dados (data/raffle-sound.js) e quem toca é
 * features/raffle-sound.js. Tique enquanto gira e fanfarra de festa na revelação; botão "Som" liga e desliga.
 */
/** Estados de um sorteio (campo `status` em raffle-draws, o mesmo das regras do Firestore). */
const RAFFLE_DRAW_STATUS = Object.freeze({ winner: "winner", absent: "absent" });
const RAFFLE_SPIN_TURNS = 6; // voltas inteiras de cada giro, só efeito visual
const RAFFLE_QR_SIZE = 176;
const RAFFLE_TELAO_QR_SIZE = 320; // no telão o QR é lido de longe

/** Tempo do giro: som decrescente de tiques + revelação no fim. Isolado pra dar pra testar sem esperar 4s. */
function createRaffleSpinTimer({ spinMs = 4200, maxTicks = 26 } = {}) {
  let tickTimer = null;
  let revealTimer = null;
  return {
    run(onTick, onReveal) {
      let ticks = 0;
      const scheduleTick = () => {
        if (ticks >= maxTicks) return;
        onTick();
        ticks++;
        tickTimer = setTimeout(scheduleTick, 60 + ticks * 6);
      };
      scheduleTick();
      revealTimer = setTimeout(onReveal, spinMs);
    },
    cancel() {
      clearTimeout(tickTimer);
      clearTimeout(revealTimer);
    },
  };
}

/** Transforma TEAM (data/team.js) numa lista de teste pro `devSeed` — só nome/sobrenome e um id que nunca
 * bate com um cadastro de verdade (`dev_<índice>`), pra girar a roleta antes de ter gente cadastrada. Só
 * quem chama (pages/sorteio.js) decide SE isso é usado (passa `[]` fora do modo DEV). */
function buildRaffleDevSeed(team) {
  return team.map((person, index) => {
    const [firstName, ...rest] = person.name.split(" ");
    return { id: `dev_${index}`, firstName, lastName: rest.join(" ") || firstName };
  });
}

function defaultRaffleDrawDeps() {
  return {
    entries: window.moderationRaffleEntriesRepository,
    draws: window.moderationRaffleDrawsRepository,
    session: window.moderationRaffleSessionRepository,
    ...defaultModeratorLoginDeps(),
  };
}

/** Aplica o ângulo final direto no elemento já existente na tela (sem recriar o HTML), pra a transição CSS
 * do `.raffle-wheel` (`styles.css`) ter um "antes" pra animar a partir dele — recriar o elemento inteiro
 * (como um re-render normal faz) já nasce no ângulo final e pula direto pra lá, sem girar visualmente.
 * Ler a geometria força o navegador a fechar o estilo de ANTES; sem depender de requestAnimationFrame, que
 * não dispara com a aba oculta/minimizada (o ângulo nunca era aplicado e o sorteio era revelado com a roda parada). */
function applyWheelRotation(rootEl, deg) {
  const wheelEl = rootEl.querySelector(".raffle-wheel");
  if (!wheelEl) return;
  wheelEl.getBoundingClientRect();
  wheelEl.style.transform = `rotate(${deg}deg)`;
}

/** Tela cheia do navegador (modo telão). Isolada pra trocar em teste: jsdom não tem a API. */
function defaultFullscreen() {
  return {
    enter: () => Promise.resolve(document.documentElement.requestFullscreen?.()).catch(() => {}),
    exit: () => (document.fullscreenElement ? Promise.resolve(document.exitFullscreen?.()).catch(() => {}) : undefined),
    isActive: () => Boolean(document.fullscreenElement),
  };
}

function initRaffleDraw(rootEl, {
  deps = defaultRaffleDrawDeps,
  devSeed = [],
  audio = () => new (window.AudioContext || window.webkitAudioContext)(),
  whenReady = runAfterModules,
  spinTimer = createRaffleSpinTimer(),
  drawQrCode = defaultDrawQrCode,
  random = Math.random,
  maxSlices = RAFFLE_WHEEL_MAX_SLICES,
  revealHoldMs = 25000, // tempo do MC anunciar o ganhador com a roda parada sob o ponteiro
  schedule = (fn, ms) => setTimeout(fn, ms),
  fullscreen = defaultFullscreen(),
  startInTelao = false,
  every = (fn, ms) => { const id = setInterval(fn, ms); return () => clearInterval(id); },
  generateCode = generateRaffleCode,
  confetti = createConfetti(),
  sound = raffleSoundRepository.getAll(),
} = {}) {
  let email = "";
  let entries = [];
  let draws = [];
  let devDraws = []; // sorteios feitos com devSeed: só em memória, nunca vai pro Firestore
  let stopEntries = null;
  let stopDraws = null;
  let spinning = false;
  let winner = null;
  let winnerPrize = 0; // número do prêmio do ganhador que está no cartão
  let winnerDrawId = ""; // id do documento dele em raffle-draws (pro botão "Ausente")
  let muted = false;
  let showQr = startInTelao;
  let entriesError = "";
  let drawsError = "";
  let audioCtx = null;
  let wheelDeg = 0; // ângulo acumulado (graus), sempre crescente: o giro nunca "volta", só soma voltas
  let spinCount = 0;
  // Fatias REALMENTE desenhadas na roda agora — travadas no início de cada giro (spin() reescreve), nunca
  // recalculadas sozinhas enquanto uma pessoa está sorteada/girando: o `wheelDeg` mirou nessa arrumação
  // exata (índice de cada fatia), tirar alguém no meio (o vencedor sai do pool assim que o sorteio grava)
  // mudaria o tamanho/posição de toda fatia e o ponteiro passaria a apontar pra outro nome. Só o próximo
  // clique em "Girar" congela uma arrumação nova (com o vencedor de fato fora).
  let displayEntries = [];
  let holding = false; // ganhador recém-revelado: a roda segue igual por `revealHoldMs`, depois se renova
  let holdToken = 0;
  let telao = startInTelao; // modo telão: tela cheia só com a roda, o contador e as chegadas (ver .raffle-telao)
  let enteredFullscreen = false;
  let qrSession = null; // { code, previous } do QR que está na tela (o mesmo que foi gravado em raffle-session)
  let stopRotation = null; // desliga a virada do código (intervalo)
  let sessionError = "";
  let seenArrivalIds = null; // null até a 1ª lista chegar: quem já estava lá não ganha a animação de "acabou de entrar"

  const isAbsent = item => item.status === RAFFLE_DRAW_STATUS.absent;
  const usingDevSeed = () => entries.length === 0 && devSeed.length > 0;
  const activeEntries = () => (usingDevSeed() ? devSeed : entries);
  const activeDraws = () => (usingDevSeed() ? devDraws : draws);

  /** Só re-trava a arrumação da roda com o pool atual quando NADA está em exibição que dependa da
   * arrumação anterior (sem giro em andamento, sem ganhador recém-revelado sob o ponteiro) — assim gente
   * nova se cadastrando enquanto a tela está parada já vai enchendo a roda (as mais recentes, até o máximo). */
  function refreshDisplayWhenIdle() {
    if (!spinning && !holding) displayEntries = idleWheelEntries(pool(), maxSlices);
  }

  /** Acabou o tempo do ganhador sob o ponteiro: a roda volta a acompanhar quem chega (já sem o ganhador) e o
   * cartão dele some — com a roda renovada a seta já não aponta pra ele, e o histórico segue em "Já sorteados". */
  function releaseReveal(token) {
    if (token !== holdToken || spinning) return;
    holding = false;
    winner = null;
    wheelDeg = 0;
    refreshDisplayWhenIdle();
    if (email) drawReady();
  }

  const draw = data => {
    const loadError = entriesError || drawsError;
    rootEl.innerHTML = raffleWheelMarkup({ email, showQr, telao, loadError, sessionError, ...data });
    drawQr(data.phase);
  };

  /** Desenha o QR com o código atual no painel (só se o painel está na tela e já há código). */
  function drawQr(phase = "ready") {
    if (!showQr || phase === "signin" || !qrSession) return;
    drawQrCode(document.getElementById("raffleQr"), raffleCheckinUrl(location.href, qrSession.code), telao ? RAFFLE_TELAO_QR_SIZE : RAFFLE_QR_SIZE);
  }

  /** Nova virada do código: grava no banco (atual + anterior) e troca o QR na tela SEM redesenhar a roleta (um
   * redesenho no meio de um giro cortaria a animação). Falha ao gravar vira aviso: um QR que o banco não conhece não vale. */
  async function publishCode() {
    qrSession = nextRaffleSession(qrSession, generateCode());
    const published = qrSession;
    const qrEl = document.getElementById("raffleQr");
    if (qrEl) qrEl.innerHTML = "";
    drawQr();
    let failed = false;
    try {
      await deps().session.set(RAFFLE_SESSION_ID, published);
    } catch {
      failed = true;
    }
    const message = failed ? t("raffle.sessionError", "Não consegui publicar o código do QR agora. Tentando de novo em instantes.") : "";
    if (message !== sessionError) {
      sessionError = message;
      if (!spinning) drawReady();
    }
  }

  /** O código só vira enquanto o QR está na tela e o moderador está logado: sem isso ninguém precisa dele. */
  function syncCodeRotation() {
    const needed = showQr && Boolean(email);
    if (needed && !stopRotation) {
      publishCode();
      stopRotation = every(publishCode, RAFFLE_CODE_PERIOD_MS);
    } else if (!needed && stopRotation) {
      stopRotation();
      stopRotation = null;
      qrSession = null;
    }
  }

  function drawnEntryIds() {
    return new Set(activeDraws().map(item => item.entryId));
  }

  function pool() {
    const excluded = drawnEntryIds();
    return activeEntries().filter(entry => !excluded.has(entry.id));
  }

  function drawReady() {
    const livePool = pool(); // quem pode legitimamente ser sorteado agora (decide o botão, não o desenho)
    const drawnList = activeDraws().slice().sort((a, b) => a.prize - b.prize || (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0));
    const arrivals = usingDevSeed() ? [] : recentArrivals(entries);
    const newArrivalIds = new Set(seenArrivalIds === null ? [] : arrivals.filter(person => !seenArrivalIds.has(person.id)).map(person => person.id));
    if (seenArrivalIds !== null) arrivals.forEach(person => seenArrivalIds.add(person.id));
    draw({
      phase: "ready",
      remaining: displayEntries, // o que a roda DESENHA — travado por refreshDisplayWhenIdle()/spin()
      remainingCount: livePool.length, // quantos ainda podem ser sorteados (a roda mostra só uma amostra)
      poolCount: activeEntries().length,
      arrivals,
      newArrivalIds,
      drawnList,
      prizesGiven: drawnList.filter(item => !isAbsent(item)).length,
      repeatedNames: findRepeatedNames(livePool),
      muted,
      spinning,
      winner,
      winnerPrize,
      winnerDrawId,
      wheelDeg,
      usingDevSeed: usingDevSeed(),
      canSpin: !spinning && livePool.length > 0,
    });
  }

  function ensureAudio() {
    if (!audioCtx) audioCtx = audio();
    return audioCtx;
  }

  function startWatching() {
    stopEntries?.();
    stopDraws?.();
    stopEntries = deps().entries.listen(
      {},
      list => {
        entries = list;
        entriesError = "";
        if (seenArrivalIds === null) seenArrivalIds = new Set(recentArrivals(list).map(person => person.id));
        refreshDisplayWhenIdle();
        drawReady();
      },
      () => { entriesError = t("raffle.loadEntriesError", "Não foi possível carregar a lista agora. Tentando de novo em instantes."); refreshDisplayWhenIdle(); drawReady(); }
    );
    stopDraws = deps().draws.listen(
      {},
      list => { draws = list; drawsError = ""; refreshDisplayWhenIdle(); drawReady(); },
      () => { drawsError = t("raffle.loadDrawsError", "Não foi possível carregar os sorteios agora. Tentando de novo em instantes."); refreshDisplayWhenIdle(); drawReady(); }
    );
  }

  /** Papel picado na revelação do ganhador: explosão saindo do cartão dele + chuva do topo. No modo telão sempre
   * (faz parte do show); fora dele respeita "Reduzir movimento". Nunca atrapalha o sorteio (o motor engole falhas). */
  function celebrate() {
    const rect = rootEl.querySelector(".raffle-winner")?.getBoundingClientRect();
    const origin = rect && rect.width ? { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.35 } : null;
    confetti.fire({ origin, force: telao });
  }

  async function spin() {
    const fullPool = pool();
    if (spinning || !fullPool.length) return;
    const chosen = pickRaffleWinner(fullPool, random); // sai SEMPRE da lista inteira, não da amostra da roda
    const wheel = buildSpinWheel(fullPool, chosen, maxSlices, random);
    // Gira sempre pra frente (seis voltas inteiras + o resto) e para exatamente com a fatia sorteada sob o
    // ponteiro (fixo no topo, 0deg): a fatia i vai de i*seg a (i+1)*seg a partir do topo, sentido horário, igual
    // o conic-gradient; estando a roda em `current` graus, o giro que põe o centro da fatia sorteada em 0deg
    // soma `(360 - centro - current) mod 360` às voltas inteiras.
    const seg = 360 / wheel.entries.length;
    const winnerCenter = wheel.winnerIndex * seg + seg / 2;
    const current = ((wheelDeg % 360) + 360) % 360;
    const targetDeg = wheelDeg + RAFFLE_SPIN_TURNS * 360 + ((((360 - winnerCenter - current) % 360) + 360) % 360);
    holding = false;
    holdToken += 1;
    spinning = true;
    winner = null;
    displayEntries = wheel.entries; // trava a MESMA arrumação usada pro cálculo do ângulo acima
    drawReady(); // primeiro render ainda no ângulo antigo: o elemento nasce parado, pronto pra animar
    wheelDeg = targetDeg;
    applyWheelRotation(rootEl, wheelDeg); // muta o elemento que já está na tela, não recria: a transição roda
    const ctx = muted ? null : ensureAudio();
    const dev = usingDevSeed();
    spinTimer.run(
      () => ctx && playRaffleTick(ctx, sound),
      async () => {
        const prize = activeDraws().filter(item => !isAbsent(item)).length + 1; // ausente não gasta o número do prêmio
        const name = `${chosen.firstName} ${chosen.lastName}`;
        const drawId = `${chosen.id}_draw`; // o id que o repository dá a add(chosen.id, "draw", ...)
        if (dev) {
          devDraws = devDraws.concat([{ id: drawId, entryId: chosen.id, name, prize, status: RAFFLE_DRAW_STATUS.winner }]);
          if (ctx) playRaffleFanfare(ctx, sound);
          winner = name;
          winnerPrize = prize;
          winnerDrawId = drawId;
        } else {
          try {
            await deps().draws.add(chosen.id, "draw", { entryKey: "draw", entryId: chosen.id, name, prize, status: RAFFLE_DRAW_STATUS.winner });
            if (ctx) playRaffleFanfare(ctx, sound);
            winner = name;
            winnerPrize = prize;
            winnerDrawId = drawId;
          } catch {
            // "permission-denied" = alguém já sorteou essa pessoa (2 telas abertas): a lista em tempo real já reflete.
            winner = null;
          }
        }
        spinning = false;
        holding = true;
        const token = (holdToken += 1);
        schedule(() => releaseReveal(token), revealHoldMs);
        drawReady();
        if (winner) celebrate();
      }
    );
  }

  /** Marca um sorteado como ausente (não estava na sala): o número do prêmio volta a ser dele de novo e a pessoa
   * continua fora da roleta (o documento do sorteio segue lá). Se era o ganhador do cartão, o cartão some e a roda renova. */
  async function markAbsent(drawId) {
    try {
      if (usingDevSeed()) devDraws = devDraws.map(item => (item.id === drawId ? { ...item, status: RAFFLE_DRAW_STATUS.absent } : item));
      else {
        await deps().draws.update(drawId, { status: RAFFLE_DRAW_STATUS.absent });
        draws = draws.map(item => (item.id === drawId ? { ...item, status: RAFFLE_DRAW_STATUS.absent } : item)); // não espera o listener
      }
    } catch {
      drawsError = t("raffle.absentError", "Não foi possível marcar como ausente agora. Tente de novo.");
      drawReady();
      return;
    }
    drawsError = "";
    if (drawId === winnerDrawId) {
      winner = null;
      holding = false;
      holdToken += 1;
      wheelDeg = 0;
    }
    refreshDisplayWhenIdle();
    drawReady();
  }

  /** Liga/desliga o modo telão: a própria área da organização vira uma tela cheia (classe `raffle-telao`). */
  function applyTelao() {
    rootEl.classList.toggle("raffle-telao", telao);
    document.body.classList.toggle("raffle-telao-open", telao);
  }

  function setTelao(on) {
    if (telao === on) return;
    telao = on;
    showQr = on || showQr;
    applyTelao();
    if (on) {
      enteredFullscreen = true;
      fullscreen.enter();
    } else {
      enteredFullscreen = false;
      fullscreen.exit();
    }
    syncCodeRotation();
    if (email) drawReady();
    else draw({ phase: "signin" });
  }

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await deps().signIn();
        startWatching();
        syncCodeRotation(); // entrou em modo telão (já com o QR na tela): o código começa a virar
      } catch (error) {
        draw({ phase: "signin", message: signInErrorMessage(error) });
      }
      return;
    }
    if (event.target.closest("[data-mod-signout]")) {
      stopEntries?.();
      stopDraws?.();
      email = "";
      syncCodeRotation();
      entries = [];
      draws = [];
      devDraws = [];
      displayEntries = [];
      seenArrivalIds = null;
      holding = false;
      holdToken += 1;
      entriesError = "";
      drawsError = "";
      draw({ phase: "signin" });
      await deps().signOut();
      return;
    }
    if (event.target.closest("[data-raffle-qr-toggle]")) {
      showQr = !showQr;
      syncCodeRotation();
      drawReady();
      return;
    }
    const absentBtn = event.target.closest("[data-raffle-absent]");
    if (absentBtn && !spinning) return markAbsent(absentBtn.dataset.raffleAbsent);
    if (event.target.closest("[data-raffle-sound-toggle]")) {
      muted = !muted;
      return drawReady();
    }
    if (event.target.closest("[data-raffle-telao-toggle]")) return setTelao(!telao);
    if (event.target.closest("[data-raffle-spin]")) return spin();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && telao) setTelao(false);
  });
  document.addEventListener("fullscreenchange", () => {
    if (enteredFullscreen && telao && !fullscreen.isActive()) setTelao(false); // saiu da tela cheia pelo navegador
  });

  applyTelao();
  draw({ phase: "signin" });
  whenReady(async () => {
    email = (await deps().restore().catch(() => null)) ?? "";
    if (email) {
      startWatching();
      syncCodeRotation();
    }
  });

  return { spin };
}

const QRCODEJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
let qrcodejsPromise = null;

/** Carrega o qrcodejs só quando alguém de fato mostra o QR (não em toda visita à aba, como o carregava fixo
 * no <head> antes) — uma promise só, reusada. Mesma lib do quadro da sala (features/checkin-display.js), CDN
 * clássica, sem módulo. */
function loadQrcodejs() {
  if (window.QRCode) return Promise.resolve();
  if (!qrcodejsPromise) {
    qrcodejsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = QRCODEJS_URL;
      script.onload = resolve;
      script.onerror = () => { qrcodejsPromise = null; reject(new Error("qrcodejs failed to load")); };
      document.head.appendChild(script);
    });
  }
  return qrcodejsPromise;
}

/** Desenha o QR no elemento, só se ainda não tiver (evita regerar a cada re-render enquanto "Mostrar QR"
 * está ligado). Isolado em função própria pra dar pra trocar em teste (sem window.QRCode em jsdom). */
async function defaultDrawQrCode(el, text, size = RAFFLE_QR_SIZE) {
  if (!el || el.childElementCount > 0) return;
  try {
    await loadQrcodejs();
  } catch {
    return; // sem internet pro CDN: o botão continua lá, tenta de novo no próximo "Mostrar QR"
  }
  if (!el.isConnected || el.childElementCount > 0) return; // a tela pode ter mudado enquanto a lib carregava
  new window.QRCode(el, { text, width: size, height: size, colorDark: "#05060a", colorLight: "#ffffff" });
}
