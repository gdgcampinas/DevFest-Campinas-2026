/**
 * Feature: cadastro no sorteio (aba Sorteio, pública). Três fases, pelo que ESTE navegador já fez
 * (myRaffleCheckin/myRaffle, data/my-raffle.js: o uid anônimo é por navegador, então é equivalente ao
 * Firestore sem gastar leitura):
 *   1) "locked" — sem o check-in do sorteio (QR mostrado pela organização NO evento): sem formulário.
 *      `?checkin=1` na URL faz o check-in (mesma ideia do `?checkin=<código>` de palestra, só que com chave
 *      fixa — o sorteio não é por palestra) e limpa o parâmetro.
 *   2) "signup" — com check-in, ainda não cadastrado: formulário.
 *   3) "done" — já cadastrado: confirmação.
 * A regra do Firestore (raffle-entries) EXIGE o check-in do sorteio pra criar o cadastro — é isso que garante
 * de verdade que não dá pra se cadastrar antes do evento nem sem estar lá, não só a tela.
 */
const RAFFLE_ENTRY_KEY = "raffle";

function initRaffleSignup(rootEl, { myRaffle, myRaffleCheckin, whenReady = runAfterModules }) {
  const phaseNow = () => {
    if (myRaffle.has(RAFFLE_ENTRY_KEY)) return "done";
    return myRaffleCheckin.has(RAFFLE_ENTRY_KEY) ? "signup" : "locked";
  };

  function render(containerEl) {
    if (!containerEl) return;
    containerEl.dataset.raffleSignupContainer = "";
    containerEl.innerHTML = raffleSignupMarkup({ phase: phaseNow() });
    renderInfoCards(raffleRulesRepository.getAll().map(rule => ({ ...rule, id: rule.title, icon: iconMarkup(rule.icon) })), document.getElementById("raffleRules"));
  }

  /** Grava o check-in do sorteio. "permission-denied" = já existia (a regra recusa o segundo): trata como feito. */
  async function doCheckin() {
    const uid = await window.firebaseClient.ensureAnonymousUid();
    try {
      await window.raffleCheckinsRepository.add(uid, RAFFLE_ENTRY_KEY, { entryKey: RAFFLE_ENTRY_KEY });
    } catch (error) {
      if (error.code !== "permission-denied") throw error;
    }
    myRaffleCheckin.addAll([RAFFLE_ENTRY_KEY]);
  }

  async function handleCheckinParam(containerEl) {
    if (!getParam("checkin")) return;
    const url = new URL(location.href);
    url.searchParams.delete("checkin");
    history.replaceState(null, "", url);
    await doCheckin().catch(() => {}); // sem internet: fica em "locked", a pessoa tenta o QR de novo
    render(containerEl);
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

  whenReady(() => handleCheckinParam(rootEl));

  return { render };
}
