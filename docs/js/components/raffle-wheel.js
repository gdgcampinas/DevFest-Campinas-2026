/**
 * Markup da roleta do sorteio (área da organização, dentro da aba Sorteio — só aparece depois do login de
 * moderador). Só desenha; features/raffle-draw.js decide a fase, sorteia e grava. `phase`: "signin" (login),
 * "ready" (roleta) ou "error". As 4 cores do topo são as da marca (data/tokens.css), sem significado próprio,
 * só ritmo visual — mesma ideia das regras do Código de conduta.
 */
const RAFFLE_WHEEL_COLORS = ["var(--google-blue)", "var(--google-red)", "var(--google-yellow)", "var(--google-green)"];

/** CSS conic-gradient com N fatias coloridas em sequência (cores repetem a cada 4). */
function raffleWheelGradient(count) {
  const seg = 360 / Math.max(count, 1);
  const stops = Array.from({ length: count }, (_, i) => `${RAFFLE_WHEEL_COLORS[i % RAFFLE_WHEEL_COLORS.length]} ${(i * seg).toFixed(2)}deg ${((i + 1) * seg).toFixed(2)}deg`);
  return `conic-gradient(${stops.join(", ")})`;
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

function raffleWheelReadyMarkup({ email, poolCount, remainingCount, drawnList, spinning, winner, mode, canSpin }) {
  const winnerBlock = winner
    ? `<div class="raffle-winner"><span class="raffle-winner-label">${t("raffle.winnerLabel", "Ganhador do prêmio {n}", { n: drawnList.length })}</span>
        <span class="raffle-winner-name">${escapeHtml(winner)}</span>
        <span class="raffle-winner-hint">${t("raffle.winnerAbsent", "Não está na sala? Gire de novo pra sortear outro nome.")}</span></div>`
    : `<p class="raffle-wheel-hint">${tn("raffle.poolCount", poolCount, "{count} pessoa cadastrada até agora.", "{count} pessoas cadastradas até agora.")}</p>`;

  return `${moderatorAccountMarkup(email)}
    <div class="raffle-wheel-stage">
      <div class="raffle-wheel-wrap">
        <div class="raffle-wheel-pointer"></div>
        <div class="raffle-wheel" style="background:${raffleWheelGradient(Math.max(remainingCount, 1))}"></div>
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

function raffleWheelMarkup({ phase, email = "", poolCount = 0, remainingCount = 0, drawnList = [], spinning = false, winner = null, mode = "rounds", canSpin = false, message = "" }) {
  const head = `<h2 class="raffle-mod-title">${t("raffle.modTitle", "Área da organização")}</h2>`;
  if (phase === "signin") return `${head}${moderatorSignInMarkup({ hint: message || t("raffle.modHint", "Entre com a conta de moderador pra girar a roleta."), signInLabel: t("raffle.modSignin", "Entrar com Google") })}`;
  if (phase === "error") return `${head}${moderatorAccountMarkup(email)}<p class="form-error" role="alert">${message}</p>`;
  return `${head}${raffleWheelReadyMarkup({ email, poolCount, remainingCount, drawnList, spinning, winner, mode, canSpin })}`;
}
