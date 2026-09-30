/**
 * Feature: cadastro no sorteio (aba Sorteio, pública). Um registro por pessoa (chave fixa RAFFLE_ENTRY_KEY),
 * nome e sobrenome. Decide a fase pelo que ESTE navegador já fez (myRaffle, data/my-raffle.js: o uid anônimo é
 * por navegador, então é equivalente ao Firestore sem gastar leitura), então `render` é síncrono. Mesmo padrão
 * de features/event-feedback.js.
 */
const RAFFLE_ENTRY_KEY = "raffle";

function initRaffleSignup(rootEl, { myRaffle }) {
  const phaseNow = () => (myRaffle.has(RAFFLE_ENTRY_KEY) ? "done" : "signup");

  function render(containerEl) {
    if (!containerEl) return;
    containerEl.dataset.raffleSignupContainer = "";
    containerEl.innerHTML = raffleSignupMarkup({ phase: phaseNow() });
  }

  rootEl.addEventListener("submit", async event => {
    const formEl = event.target.closest("[data-raffle-signup-form]");
    if (!formEl) return;
    event.preventDefault();
    const container = formEl.closest("[data-raffle-signup-container]");
    const submitBtn = formEl.querySelector("[type=submit]");
    const text = field => formEl.querySelector(`[name=${field}]`).value.trim();
    const firstName = text("firstName");
    const lastName = text("lastName");
    const consent = formEl.querySelector("[name=consent]").checked;
    if (!firstName || !lastName) return showFormError(formEl, submitBtn, t("raffle.nameRequired", "Preencha nome e sobrenome pra participar."));
    if (!consent) return showFormError(formEl, submitBtn, t("raffle.consentRequired", "Marque a autorização pra participar do sorteio."));
    submitBtn.disabled = true;
    try {
      const uid = await window.firebaseClient.ensureAnonymousUid();
      await window.raffleEntriesRepository.add(uid, RAFFLE_ENTRY_KEY, { entryKey: RAFFLE_ENTRY_KEY, firstName, lastName });
      myRaffle.addAll([RAFFLE_ENTRY_KEY]);
      render(container);
    } catch (error) {
      // "permission-denied" aqui é a regra recusando um 2º cadastro (já existia): trata como sucesso, não erro.
      if (error.code === "permission-denied") {
        myRaffle.addAll([RAFFLE_ENTRY_KEY]);
        render(container);
        return;
      }
      submitBtn.disabled = false;
      showFormError(formEl, submitBtn, t("raffle.sendError", "Não foi possível enviar agora. Confira sua conexão e tente de novo."));
    }
  });

  return { render };
}
