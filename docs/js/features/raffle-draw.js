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
 * Som: sintetizado (Web Audio), sem depender de arquivo externo — troca fácil por um efeito de verdade depois
 * (só mudar `tick`/`chime`).
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

/** Tempo do giro: som decrescente de tiques + revelação no fim. Isolado pra dar pra testar sem esperar 4s de verdade. */
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

function defaultRaffleDrawDeps() {
  return {
    entries: window.moderationRaffleEntriesRepository,
    draws: window.moderationRaffleDrawsRepository,
    ...defaultModeratorLoginDeps(),
  };
}

function initRaffleDraw(rootEl, { deps = defaultRaffleDrawDeps, audio = () => new (window.AudioContext || window.webkitAudioContext)(), whenReady = runAfterModules, spinTimer = createRaffleSpinTimer() } = {}) {
  let email = "";
  let entries = [];
  let draws = [];
  let stopEntries = null;
  let stopDraws = null;
  let mode = "rounds";
  let spinning = false;
  let winner = null;
  let muted = false;
  let audioCtx = null;

  const draw = data => { rootEl.innerHTML = raffleWheelMarkup({ email, mode, ...data }); };

  function drawnEntryIds() {
    return new Set(draws.map(item => item.entryId));
  }

  function pool() {
    const excluded = drawnEntryIds();
    return entries.filter(entry => !excluded.has(entry.id));
  }

  function drawReady() {
    const remaining = pool();
    draw({
      phase: "ready",
      poolCount: entries.length,
      remainingCount: remaining.length,
      drawnList: draws.slice().sort((a, b) => a.prize - b.prize),
      spinning,
      winner,
      canSpin: !spinning && remaining.length > 0 && !(mode === "single" && draws.length >= 1),
    });
  }

  function ensureAudio() {
    if (!audioCtx) audioCtx = audio();
    return audioCtx;
  }

  function startWatching() {
    stopEntries?.();
    stopDraws?.();
    stopEntries = deps().entries.listen({}, list => { entries = list; drawReady(); }, () => draw({ phase: "error", message: "Não foi possível carregar a lista agora. Tentando de novo em instantes." }));
    stopDraws = deps().draws.listen({}, list => { draws = list; drawReady(); }, () => draw({ phase: "error", message: "Não foi possível carregar os sorteios agora. Tentando de novo em instantes." }));
  }

  async function spin() {
    const remaining = pool();
    if (spinning || !remaining.length || (mode === "single" && draws.length >= 1)) return;
    const chosen = remaining[Math.floor(Math.random() * remaining.length)];
    spinning = true;
    winner = null;
    drawReady();
    const ctx = muted ? null : ensureAudio();
    spinTimer.run(
      () => ctx && raffleTick(ctx),
      async () => {
        const prize = draws.length + 1;
        try {
          await deps().draws.add(chosen.id, "draw", { entryKey: "draw", entryId: chosen.id, name: `${chosen.firstName} ${chosen.lastName}`, prize });
          if (ctx) raffleChime(ctx);
          winner = `${chosen.firstName} ${chosen.lastName}`;
        } catch {
          // "permission-denied" = alguém já sorteou essa pessoa (2 telas abertas): a lista em tempo real já reflete.
          winner = null;
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
      draw({ phase: "signin" });
      await deps().signOut();
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
