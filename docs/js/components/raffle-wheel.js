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
 * (truque clássico de rótulo em roleta CSS, sem depender de canvas/SVG). Nome + último sobrenome, pra caber. */
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
    return `<div class="raffle-wheel-label" style="transform:rotate(${rotation.toFixed(2)}deg)"><span${flip ? ' style="transform:rotate(180deg)"' : ""}>${escapeHtml(raffleDisplayName(person))}</span></div>`;
  }).join("");
}

/** Um sorteado da lista. Quem não estava na sala ("absent") fica riscado e não tem mais botão; os demais têm o
 * botão "Ausente", que serve a qualquer hora (o cartão do ganhador some depois de um tempo). */
function raffleDrawnItemMarkup(item) {
  const absent = item.status === "absent";
  const action = absent
    ? `<span class="raffle-drawn-badge">${t("raffle.absent", "Ausente")}</span>`
    : `<button type="button" class="chip-btn raffle-absent-btn" data-raffle-absent="${escapeHtml(item.id)}">${t("raffle.absent", "Ausente")}</button>`;
  return `<li class="raffle-drawn-item${absent ? " is-absent" : ""}"><span class="raffle-drawn-prize">${item.prize}</span><span class="raffle-drawn-name">${escapeHtml(item.name)}</span>${action}</li>`;
}

/** QR do check-in do sorteio (`sorteio.html?checkin=1`): escondido por padrão, o moderador mostra quando
 * for projetar/imprimir. O desenho em si (`new QRCode(...)`) é feito por quem chama, no container por id. */
function raffleQrToggleMarkup(showQr) {
  return `<button type="button" class="chip-btn raffle-qr-toggle" data-raffle-qr-toggle>${showQr ? t("raffle.qrHide", "Esconder QR do sorteio") : t("raffle.qrShow", "Mostrar QR do sorteio")}</button>`;
}

function raffleQrPanelMarkup(showQr) {
  return showQr ? `<div class="raffle-qr-wrap"><div id="raffleQr"></div><p class="raffle-qr-hint">${t("raffle.qrHint", "Projete ou imprima esse QR só no dia do evento.")}</p></div>` : "";
}

function raffleTelaoToggleMarkup(telao) {
  return `<button type="button" class="chip-btn raffle-telao-toggle" data-raffle-telao-toggle>${telao ? t("raffle.telaoExit", "Sair do modo telão") : t("raffle.telaoEnter", "Modo telão")}</button>`;
}

function raffleWheelReadyMarkup({ email, remaining, remainingCount, poolCount, drawnList, prizesGiven, arrivals, newArrivalIds, spinning, winner, winnerPrize, winnerDrawId, canSpin, loadError, usingDevSeed, showQr, telao, wheelDeg }) {
  const winnerBlock = winner
    ? `<div class="raffle-winner"><span class="raffle-winner-label">${t("raffle.winnerLabel", "Ganhador do prêmio {n}", { n: winnerPrize })}</span>
        <span class="raffle-winner-name">${escapeHtml(winner)}</span>
        <span class="raffle-winner-hint">${t("raffle.winnerAbsent", "Não está na sala? Marque como ausente e gire de novo.")}</span>
        <button type="button" class="chip-btn raffle-absent-btn" data-raffle-absent="${escapeHtml(winnerDrawId)}">${t("raffle.absentDrawAnother", "Ausente, sortear outro")}</button></div>`
    : `<p class="raffle-wheel-hint">${tn("raffle.poolCount", poolCount, "{count} pessoa cadastrada até agora.", "{count} pessoas cadastradas até agora.")}</p>`;

  return `${moderatorAccountMarkup(email)}
    ${loadError ? `<p class="form-error raffle-load-error" role="alert">${loadError}</p>` : ""}
    ${usingDevSeed ? `<p class="raffle-dev-badge">${t("raffle.devSeedBadge", "Modo DEV: ninguém cadastrado ainda, girando com a lista do Time só pra teste (não grava nada).")}</p>` : ""}
    <div class="raffle-controls">${raffleQrToggleMarkup(showQr)}${raffleTelaoToggleMarkup(telao)}</div>
    <div class="raffle-layout">
      <div class="raffle-wheel-stage">
        <div class="raffle-wheel-wrap">
          <div class="raffle-wheel-pointer"></div>
          <div class="raffle-wheel" style="background:${raffleWheelGradient(Math.max(remaining.length, 1))};transform:rotate(${wheelDeg}deg)">${raffleWheelLabelsMarkup(remaining)}</div>
          <button type="button" class="raffle-spin-btn" data-raffle-spin${canSpin ? "" : " disabled"}>${spinning ? t("raffle.spinning", "Girando…") : t("raffle.spin", "Girar")}</button>
        </div>
        ${winnerBlock}
      </div>
      <div class="raffle-mod-side">
        ${raffleCounterMarkup(poolCount)}
        ${raffleArrivalsMarkup(arrivals, newArrivalIds)}
        ${raffleQrPanelMarkup(showQr)}
        <p class="raffle-rounds-hint">${t("raffle.roundsHint", "Gira de novo pra cada prêmio, sem repetir quem já ganhou.")}</p>
        <div class="raffle-stats">
          <div class="raffle-stat"><span class="raffle-stat-value">${remainingCount}</span><span class="raffle-stat-label">${t("raffle.remaining", "Na lista")}</span></div>
          <div class="raffle-stat"><span class="raffle-stat-value">${prizesGiven}</span><span class="raffle-stat-label">${t("raffle.drawnCount", "Já sorteados")}</span></div>
        </div>
        <div class="raffle-drawn">
          <span class="raffle-drawn-title">${t("raffle.drawnTitle", "Já sorteados")}</span>
          ${drawnList.length ? `<ol class="raffle-drawn-list">${drawnList.map(raffleDrawnItemMarkup).join("")}</ol>` : `<p class="mod-hint">${t("raffle.drawnEmpty", "Ninguém sorteado ainda.")}</p>`}
        </div>
      </div>
    </div>`;
}

function raffleWheelMarkup({ phase, email = "", remaining = [], remainingCount = remaining.length, poolCount = 0, drawnList = [], prizesGiven = drawnList.filter(item => item.status !== "absent").length, arrivals = [], newArrivalIds = new Set(), spinning = false, winner = null, winnerPrize = 0, winnerDrawId = "", canSpin = false, loadError = "", usingDevSeed = false, showQr = false, telao = false, wheelDeg = 0, message = "" }) {
  const head = `<h2 class="raffle-mod-title">${t("raffle.modTitle", "Área da organização")}</h2>`;
  if (phase === "signin") return `${head}${telao ? raffleTelaoToggleMarkup(true) : ""}${moderatorSignInMarkup({ hint: message || t("raffle.modHint", "Entre com a conta de moderador pra girar a roleta."), signInLabel: t("raffle.modSignin", "Entrar com Google") })}`;
  return `${head}${raffleWheelReadyMarkup({ email, remaining, remainingCount, poolCount, drawnList, prizesGiven, arrivals, newArrivalIds, spinning, winner, winnerPrize, winnerDrawId, canSpin, loadError, usingDevSeed, showQr, telao, wheelDeg })}`;
}
