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
 * Som: sintetizado (Web Audio), sem depender de arquivo externo — troca fácil por um efeito de verdade depois
 * (só mudar `raffleTick`/`raffleChime`).
 */
function raffleTick(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 680;
  gain.gain.value = 0.05;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  osc.stop(ctx.currentTime + 0.06);
}

function raffleChime(ctx) {
  [660, 880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(ctx.destination);
    const at = ctx.currentTime + i * 0.09;
    osc.start(at);
    gain.gain.linearRampToValueAtTime(0.09, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0005, at + 0.5);
    osc.stop(at + 0.55);
  });
}

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

/** Link que o QR do sorteio abre: a própria página, só com `?checkin=1` (limpa qualquer outro parâmetro,
 * ex.: `?lineup=1`). Dual (sem `location`, em Node testa string simples) — quem chama passa a URL atual. */
function raffleCheckinUrl(href) {
  const url = new URL(href);
  url.search = "";
  url.searchParams.set("checkin", "1");
  return url.toString();
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
    ...defaultModeratorLoginDeps(),
  };
}

/** Aplica o ângulo final direto no elemento já existente na tela (sem recriar o HTML), pra a transição CSS
 * do `.raffle-wheel` (`styles.css`) ter um "antes" pra animar a partir dele — recriar o elemento inteiro
 * (como um re-render normal faz) já nasce no ângulo final e pula direto pra lá, sem girar visualmente. */
function applyWheelRotation(rootEl, deg) {
  const wheelEl = rootEl.querySelector(".raffle-wheel");
  if (wheelEl) wheelEl.style.transform = `rotate(${deg}deg)`;
}

function initRaffleDraw(rootEl, { deps = defaultRaffleDrawDeps, devSeed = [], audio = () => new (window.AudioContext || window.webkitAudioContext)(), whenReady = runAfterModules, spinTimer = createRaffleSpinTimer(), drawQrCode = defaultDrawQrCode, raf = (window.requestAnimationFrame || (fn => setTimeout(fn, 16))).bind(window) } = {}) {
  let email = "";
  let entries = [];
  let draws = [];
  let devDraws = []; // sorteios feitos com devSeed: só em memória, nunca vai pro Firestore
  let stopEntries = null;
  let stopDraws = null;
  let mode = "rounds";
  let spinning = false;
  let winner = null;
  let muted = false;
  let showQr = false;
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

  const usingDevSeed = () => entries.length === 0 && devSeed.length > 0;
  const activeEntries = () => (usingDevSeed() ? devSeed : entries);
  const activeDraws = () => (usingDevSeed() ? devDraws : draws);

  /** Só re-trava a arrumação da roda com o pool atual quando NADA está em exibição que dependa da
   * arrumação anterior (sem giro em andamento, sem vencedor mostrado) — ex.: gente nova se cadastrando
   * enquanto a tela está parada entre um prêmio e outro já deve aparecer na roda antes do próximo giro. */
  function refreshDisplayWhenIdle() {
    if (!spinning && winner === null) displayEntries = pool();
  }

  const draw = data => {
    const loadError = entriesError || drawsError;
    rootEl.innerHTML = raffleWheelMarkup({ email, mode, showQr, loadError, ...data });
    if (showQr && data.phase !== "signin") drawQrCode(document.getElementById("raffleQr"), raffleCheckinUrl(location.href));
  };

  function drawnEntryIds() {
    return new Set(activeDraws().map(item => item.entryId));
  }

  function pool() {
    const excluded = drawnEntryIds();
    return activeEntries().filter(entry => !excluded.has(entry.id));
  }

  function drawReady() {
    const livePool = pool(); // quem pode legitimamente ser sorteado agora (decide o botão, não o desenho)
    const drawnList = activeDraws().slice().sort((a, b) => a.prize - b.prize);
    draw({
      phase: "ready",
      remaining: displayEntries, // o que a roda DESENHA — travado por refreshDisplayWhenIdle()/spin()
      poolCount: activeEntries().length,
      drawnList,
      spinning,
      winner,
      wheelDeg,
      usingDevSeed: usingDevSeed(),
      canSpin: !spinning && livePool.length > 0 && !(mode === "single" && drawnList.length >= 1),
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
      list => { entries = list; entriesError = ""; refreshDisplayWhenIdle(); drawReady(); },
      () => { entriesError = t("raffle.loadEntriesError", "Não foi possível carregar a lista agora. Tentando de novo em instantes."); refreshDisplayWhenIdle(); drawReady(); }
    );
    stopDraws = deps().draws.listen(
      {},
      list => { draws = list; drawsError = ""; refreshDisplayWhenIdle(); drawReady(); },
      () => { drawsError = t("raffle.loadDrawsError", "Não foi possível carregar os sorteios agora. Tentando de novo em instantes."); refreshDisplayWhenIdle(); drawReady(); }
    );
  }

  async function spin() {
    const remaining = pool();
    if (spinning || !remaining.length || (mode === "single" && activeDraws().length >= 1)) return;
    const chosenIndex = Math.floor(Math.random() * remaining.length);
    const chosen = remaining[chosenIndex];
    // Gira sempre pra frente (soma voltas inteiras) e para exatamente com a fatia sorteada sob o ponteiro
    // (fixo no topo, 0deg): a fatia i vai de i*seg a (i+1)*seg a partir do topo, sentido horário, igual o
    // conic-gradient; girar o disco por R graus põe o ângulo "a" na tela em (a+R) mod 360 — o R certo pra
    // o centro da fatia sorteada terminar em 0deg (debaixo do ponteiro) é 360 - centro.
    const seg = 360 / remaining.length;
    const winnerCenter = chosenIndex * seg + seg / 2;
    spinCount += 1;
    const targetDeg = spinCount * 2160 + ((360 - winnerCenter) % 360); // 2160 = 6 voltas inteiras, só efeito visual
    spinning = true;
    winner = null;
    displayEntries = remaining; // trava a MESMA arrumação usada pro cálculo do ângulo acima
    drawReady(); // primeiro render ainda no ângulo antigo: o elemento nasce parado, pronto pra animar
    raf(() => {
      wheelDeg = targetDeg;
      applyWheelRotation(rootEl, wheelDeg); // muta o elemento que já está na tela, não recria: a transição roda
    });
    const ctx = muted ? null : ensureAudio();
    const dev = usingDevSeed();
    spinTimer.run(
      () => ctx && raffleTick(ctx),
      async () => {
        const prize = activeDraws().length + 1;
        const name = `${chosen.firstName} ${chosen.lastName}`;
        if (dev) {
          devDraws = devDraws.concat([{ entryId: chosen.id, name, prize }]);
          if (ctx) raffleChime(ctx);
          winner = name;
        } else {
          try {
            await deps().draws.add(chosen.id, "draw", { entryKey: "draw", entryId: chosen.id, name, prize });
            if (ctx) raffleChime(ctx);
            winner = name;
          } catch {
            // "permission-denied" = alguém já sorteou essa pessoa (2 telas abertas): a lista em tempo real já reflete.
            winner = null;
          }
        }
        spinning = false;
        drawReady();
      }
    );
  }

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        email = await deps().signIn();
        startWatching();
      } catch (error) {
        draw({ phase: "signin", message: signInErrorMessage(error) });
      }
      return;
    }
    if (event.target.closest("[data-mod-signout]")) {
      stopEntries?.();
      stopDraws?.();
      email = "";
      entries = [];
      draws = [];
      devDraws = [];
      displayEntries = [];
      entriesError = "";
      drawsError = "";
      draw({ phase: "signin" });
      await deps().signOut();
      return;
    }
    if (event.target.closest("[data-raffle-qr-toggle]")) {
      showQr = !showQr;
      drawReady();
      return;
    }
    if (event.target.closest("[data-raffle-spin]")) return spin();
    const modeBtn = event.target.closest("[data-raffle-mode]");
    if (modeBtn) {
      mode = modeBtn.dataset.raffleMode;
      drawReady();
    }
  });

  draw({ phase: "signin" });
  whenReady(async () => {
    email = (await deps().restore().catch(() => null)) ?? "";
    if (email) startWatching();
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
async function defaultDrawQrCode(el, text) {
  if (!el || el.childElementCount > 0) return;
  try {
    await loadQrcodejs();
  } catch {
    return; // sem internet pro CDN: o botão continua lá, tenta de novo no próximo "Mostrar QR"
  }
  if (!el.isConnected || el.childElementCount > 0) return; // a tela pode ter mudado enquanto a lib carregava
  new window.QRCode(el, { text, width: 176, height: 176, colorDark: "#05060a", colorLight: "#ffffff" });
}
