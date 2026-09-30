/**
 * Markup da roleta do sorteio (área da organização, dentro da aba Sorteio — só aparece depois do login de
 * moderador). Só desenha; features/raffle-draw.js decide a fase, sorteia, calcula o ângulo e grava. `phase`:
 * "signin" (login) ou "ready" (roleta — sempre aparece depois do login, mesmo se a lista falhar ao carregar
 * ou estiver vazia; um erro de carregar vira `loadError`, um aviso pequeno por cima, nunca esconde a roleta).
 * As 4 cores das fatias são as da marca (data/tokens.css), sem significado próprio, só ritmo visual.
 */
const RAFFLE_WHEEL_COLORS = ["var(--google-blue)", "var(--google-red)", "var(--google-yellow)", "var(--google-green)"];
const RAFFLE_WHEEL_DIVIDER = "var(--bg)"; // linha fina entre fatias, cor do fundo do site: contraste com as 4 cores
const RAFFLE_WHEEL_DIVIDER_DEG = 1.6; // grau fixo (não px): mesma largura visual em qualquer contagem de pessoas

/** CSS conic-gradient com N fatias coloridas em sequência (cores repetem a cada 4), cada uma com uma linha
 * fina do fundo do site na borda — sem ela, 2 fatias vizinhas da mesma cor (inevitável com só 4 cores e
 * contagem variável) se fundiam numa só faixa visual, dificultando ver onde uma fatia termina e a próxima
 * começa (ex.: contagens que "voltam" pro azul logo depois de outro azul, ou olhando de relance na hora do
 * sorteio). `half` nunca passa de 30% de uma fatia bem pequena, pra nunca comer a cor toda dela. */
function raffleWheelGradient(count) {
  const seg = 360 / Math.max(count, 1);
  const line = Math.min(RAFFLE_WHEEL_DIVIDER_DEG, seg * 0.3);
  // Cada fatia = cor + linha no fim dela, sem NENHUM vão entre uma e outra: um vão faz o navegador
  // interpolar (borrar) o trecho em vez de desenhar uma borda reta.
  const stops = Array.from({ length: count }, (_, i) => {
    const start = i * seg;
    const end = (i + 1) * seg;
    const color = RAFFLE_WHEEL_COLORS[i % RAFFLE_WHEEL_COLORS.length];
    return `${color} ${start.toFixed(2)}deg ${(end - line).toFixed(2)}deg, ${RAFFLE_WHEEL_DIVIDER} ${(end - line).toFixed(2)}deg ${end.toFixed(2)}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

/** Um nome por fatia, girando junto com a roda (é filho do próprio `.raffle-wheel`): `.raffle-wheel-label`
 * é uma linha de 0 de altura presa no centro, rodada até o meio da fatia; o texto anda pra fora nessa linha
 * (truque clássico de rótulo em roleta CSS, sem depender de canvas/SVG). Só o primeiro nome, pra caber. */
function raffleWheelLabelsMarkup(remaining) {
  const seg = 360 / Math.max(remaining.length, 1);
  return remaining.map((person, i) => {
    const center = i * seg + seg / 2; // graus a partir das 12h, sentido horário (igual ao conic-gradient)
    // A linha do rótulo aponta pras 3h com rotate(0), e o conic-gradient começa às 12h: sem tirar 90° os
    // nomes ficavam meia fatia (ou mais) fora da própria cor.
    const rotation = center - 90;
    // Com a linha apontando pra esquerda (rotação entre 90° e 270°, ou seja center entre 180° e 360°) o
    // texto ficaria de cabeça pra baixo: rotaciona só o texto (não a posição) mais 180° de volta.
    const flip = center > 180 && center < 360;
    return `<div class="raffle-wheel-label" style="transform:rotate(${rotation.toFixed(2)}deg)"><span${flip ? ' style="transform:rotate(180deg)"' : ""}>${escapeHtml(person.firstName)}</span></div>`;
  }).join("");
}

function raffleDrawnItemMarkup(item) {
  return `<li class="raffle-drawn-item"><span class="raffle-drawn-prize">${item.prize}</span><span class="raffle-drawn-name">${escapeHtml(item.name)}</span></li>`;
}

function raffleModeToggleMarkup(mode) {
  const modes = [
    { value: "rounds", label: t("raffle.modeRounds", "Por rodadas") },
    { value: "single", label: t("raffle.modeSingle", "Sorteio único") },
  ];
  return `<div class="raffle-mode-toggle" role="group" aria-label="${t("raffle.modeLabel", "Modo do sorteio")}">
    ${modes.map(option => `<button type="button" class="raffle-mode-btn${option.value === mode ? " is-active" : ""}" data-raffle-mode="${option.value}">${option.label}</button>`).join("")}
  </div>`;
}

/** QR do check-in do sorteio (`sorteio.html?checkin=1`): escondido por padrão, o moderador mostra quando
 * for projetar/imprimir. O desenho em si (`new QRCode(...)`) é feito por quem chama, no container por id. */
function raffleQrMarkup(showQr) {
  return `<div class="raffle-qr-block">
    <button type="button" class="chip-btn raffle-qr-toggle" data-raffle-qr-toggle>${showQr ? t("raffle.qrHide", "Esconder QR do sorteio") : t("raffle.qrShow", "Mostrar QR do sorteio")}</button>
    ${showQr ? `<div class="raffle-qr-wrap"><div id="raffleQr"></div><p class="raffle-qr-hint">${t("raffle.qrHint", "Projete ou imprima esse QR só no dia do evento.")}</p></div>` : ""}
  </div>`;
}

function raffleWheelReadyMarkup({ email, remaining, poolCount, drawnList, spinning, winner, mode, canSpin, loadError, usingDevSeed, showQr, wheelDeg }) {
  const remainingCount = remaining.length;
  const winnerBlock = winner
    ? `<div class="raffle-winner"><span class="raffle-winner-label">${t("raffle.winnerLabel", "Ganhador do prêmio {n}", { n: drawnList.length })}</span>
        <span class="raffle-winner-name">${escapeHtml(winner)}</span>
        <span class="raffle-winner-hint">${t("raffle.winnerAbsent", "Não está na sala? Gire de novo pra sortear outro nome.")}</span></div>`
    : `<p class="raffle-wheel-hint">${tn("raffle.poolCount", poolCount, "{count} pessoa cadastrada até agora.", "{count} pessoas cadastradas até agora.")}</p>`;

  return `${moderatorAccountMarkup(email)}
    ${loadError ? `<p class="form-error raffle-load-error" role="alert">${loadError}</p>` : ""}
    ${usingDevSeed ? `<p class="raffle-dev-badge">${t("raffle.devSeedBadge", "Modo DEV: ninguém cadastrado ainda, girando com a lista do Time só pra teste (não grava nada).")}</p>` : ""}
    ${raffleQrMarkup(showQr)}
    <div class="raffle-wheel-stage">
      <div class="raffle-wheel-wrap">
        <div class="raffle-wheel-pointer"></div>
        <div class="raffle-wheel" style="background:${raffleWheelGradient(Math.max(remainingCount, 1))};transform:rotate(${wheelDeg}deg)">${raffleWheelLabelsMarkup(remaining)}</div>
        <button type="button" class="raffle-spin-btn" data-raffle-spin${canSpin ? "" : " disabled"}>${spinning ? t("raffle.spinning", "Girando…") : t("raffle.spin", "Girar")}</button>
      </div>
      ${winnerBlock}
    </div>
    <div class="raffle-mod-side">
      ${raffleModeToggleMarkup(mode)}
      <p class="raffle-mode-hint">${t("raffle.modeHint", "Por rodadas: gira de novo pra cada prêmio, sem repetir quem já ganhou. Sorteio único: só um nome sai, o botão trava depois.")}</p>
      <div class="raffle-stats">
        <div class="raffle-stat"><span class="raffle-stat-value">${remainingCount}</span><span class="raffle-stat-label">${t("raffle.remaining", "Na lista")}</span></div>
        <div class="raffle-stat"><span class="raffle-stat-value">${drawnList.length}</span><span class="raffle-stat-label">${t("raffle.drawnCount", "Já sorteados")}</span></div>
      </div>
      <div class="raffle-drawn">
        <span class="raffle-drawn-title">${t("raffle.drawnTitle", "Já sorteados")}</span>
        ${drawnList.length ? `<ol class="raffle-drawn-list">${drawnList.map(raffleDrawnItemMarkup).join("")}</ol>` : `<p class="mod-hint">${t("raffle.drawnEmpty", "Ninguém sorteado ainda.")}</p>`}
      </div>
    </div>`;
}

function raffleWheelMarkup({ phase, email = "", remaining = [], poolCount = 0, drawnList = [], spinning = false, winner = null, mode = "rounds", canSpin = false, loadError = "", usingDevSeed = false, showQr = false, wheelDeg = 0, message = "" }) {
  const head = `<h2 class="raffle-mod-title">${t("raffle.modTitle", "Área da organização")}</h2>`;
  if (phase === "signin") return `${head}${moderatorSignInMarkup({ hint: message || t("raffle.modHint", "Entre com a conta de moderador pra girar a roleta."), signInLabel: t("raffle.modSignin", "Entrar com Google") })}`;
  return `${head}${raffleWheelReadyMarkup({ email, remaining, poolCount, drawnList, spinning, winner, mode, canSpin, loadError, usingDevSeed, showQr, wheelDeg })}`;
}
