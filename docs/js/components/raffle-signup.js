/**
 * Markup do cadastro no sorteio (aba Sorteio, todo mundo vê). Duas fases: "signup" (formulário) e "done"
 * (confirmação, depois de cadastrado). Só desenha; features/raffle-signup.js decide a fase e grava.
 */
function raffleSignupExplainerMarkup() {
  return `<div class="raffle-hero">
    <div class="raffle-hero-icon">${iconMarkup("gift")}</div>
    <p>${t("raffle.explainer", "No fim do evento a organização sorteia brindes ao vivo, com a lista de todo mundo que passou por aqui. Cadastre seu nome pra entrar.")}</p>
  </div>`;
}

function raffleSignupFormMarkup() {
  return `<form class="raffle-form" data-raffle-signup-form>
    <h2 class="raffle-form-title">${t("raffle.formTitle", "Cadastre seu nome")}</h2>
    <div class="raffle-field">
      <label for="raffleFirstName">${t("raffle.firstName", "Nome")}</label>
      <input id="raffleFirstName" class="feedback-input" type="text" name="firstName" placeholder="${t("raffle.firstNamePlaceholder", "Seu nome")}" maxlength="59" autocomplete="given-name" required>
    </div>
    <div class="raffle-field">
      <label for="raffleLastName">${t("raffle.lastName", "Sobrenome")}</label>
      <input id="raffleLastName" class="feedback-input" type="text" name="lastName" placeholder="${t("raffle.lastNamePlaceholder", "Seu sobrenome")}" maxlength="79" autocomplete="family-name" required>
    </div>
    <label class="raffle-consent">
      <input type="checkbox" name="consent" required>
      <span>${t("raffle.consent", "Autorizo meu nome a ser sorteado e exibido na tela do evento durante o sorteio.")}</span>
    </label>
    <button type="submit" class="chip-btn chip-btn--primary raffle-submit">${t("raffle.submit", "Quero participar")}</button>
  </form>`;
}

function raffleSignupDoneMarkup() {
  return `<div class="raffle-done">
    <div class="raffle-done-icon">${iconMarkup("check")}</div>
    <p class="raffle-done-title">${t("raffle.doneTitle", "Você está participando!")}</p>
    <p class="raffle-done-hint">${t("raffle.doneHint", "Fique de olho na hora do sorteio, no encerramento.")}</p>
  </div>`;
}

function raffleSignupMarkup({ phase }) {
  return `${raffleSignupExplainerMarkup()}${phase === "done" ? raffleSignupDoneMarkup() : raffleSignupFormMarkup()}`;
}
