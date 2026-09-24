/**
 * Formulário "confirme sua inscrição" (e-mail do Sympla). Puro template:
 * features/registration-gate.js decide a fase e liga o envio. Fases:
 *   "form"      → pedir o e-mail
 *   "checking"  → consultando
 *   "not-found" → e-mail sem inscrição (mostra o botão de ingresso)
 *   "error"     → falha de rede ao consultar
 * `ticketButtonHtml` já vem pronto de quem chama (mesmo botão de compra do site).
 */
const registrationGateMessage = phase => ({
  "not-found": t("gate.notFound", "Não encontramos inscrição com esse e-mail. Se você acabou de se inscrever, aguarde alguns minutos e tente de novo."),
  error: t("gate.error", "Não deu pra verificar agora. Tente de novo em instantes."),
})[phase];

function registrationGateMarkup({ phase = "form", ticketButtonHtml = "" } = {}) {
  if (phase === "checking") {
    return `<div class="registration-gate"><p class="registration-gate-hint">${t("gate.checking", "Verificando sua inscrição…")}</p></div>`;
  }
  const message = registrationGateMessage(phase);
  return `<form class="registration-gate" data-registration-gate-form>
    <h3 class="registration-gate-title">${iconMarkup("check")}${t("gate.title", "Confirme sua inscrição")}</h3>
    <p class="registration-gate-hint">${t("gate.hint", "Digite o e-mail usado na inscrição do Sympla. Pode levar alguns minutos depois da confirmação.")}</p>
    <input type="email" class="feedback-input" name="email" required autocomplete="email" placeholder="${t("gate.email", "E-mail da inscrição")}">
    ${message ? `<p class="registration-gate-error" role="alert">${message}</p>` : ""}
    <div class="registration-gate-actions">
      <button type="submit" class="chip-btn chip-btn--primary">${t("gate.verify", "Verificar")}</button>
      ${phase === "not-found" ? ticketButtonHtml : ""}
    </div>
  </form>`;
}
