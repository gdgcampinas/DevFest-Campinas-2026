/**
 * Markup do cadastro no sorteio (aba Sorteio, todo mundo vê). Três fases: "locked" (sem o check-in do
 * evento, sem formulário), "signup" (formulário) e "done" (confirmação, depois de cadastrado). Só desenha;
 * features/raffle-signup.js decide a fase e grava.
 */
function raffleSignupExplainerMarkup() {
  return `<div class="raffle-hero">
    <div class="raffle-hero-icon">${iconMarkup("gift")}</div>
    <p>${t("raffle.explainer", "No fim do evento a organização sorteia brindes ao vivo, com a lista de quem participou. Confira as regras e cadastre seu nome pra entrar.")}</p>
  </div>`;
}

/** Por que o check-in não passou ("expired" = o QR já virou; "offline" = sem conexão): a pessoa sabe o que fazer. */
const RAFFLE_LOCKED_NOTICES = {
  expired: () => ({ title: t("raffle.expiredTitle", "Esse QR expirou"), hint: t("raffle.expiredHint", "O QR do sorteio muda a cada minuto. Escaneie de novo o QR que está no telão.") }),
  offline: () => ({ title: t("raffle.offlineTitle", "Sem conexão agora"), hint: t("raffle.offlineHint", "Confira a internet e escaneie o QR do sorteio de novo.") }),
};

function raffleSignupLockedMarkup({ notice = "" } = {}) {
  const { title, hint } = RAFFLE_LOCKED_NOTICES[notice]?.() ?? {
    title: t("raffle.lockedTitle", "Cadastro só durante o evento"),
    hint: t("raffle.lockedHint", "Escaneie o QR do sorteio, mostrado pela organização no DevFest, pra liberar o cadastro."),
  };
  return `<div class="raffle-form raffle-locked">
    <div class="raffle-done-icon">${iconMarkup("shield")}</div>
    <p class="raffle-done-title">${title}</p>
    <p class="raffle-done-hint">${hint}</p>
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

const RAFFLE_SIGNUP_MARKUP = { locked: raffleSignupLockedMarkup, done: raffleSignupDoneMarkup };

function raffleSignupMarkup({ phase, notice = "" }) {
  const body = (RAFFLE_SIGNUP_MARKUP[phase] ?? raffleSignupFormMarkup)({ notice });
  return `${raffleSignupExplainerMarkup()}<div class="faq-grid raffle-rules" id="raffleRules"></div>${body}`;
}
