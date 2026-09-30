/**
 * Feature: cadastro no sorteio (aba Sorteio, pública). Três fases, pelo que ESTE navegador já fez
 * (myRaffleCheckin/myRaffle, data/my-raffle.js: o uid anônimo é por navegador, então é equivalente ao
 * Firestore sem gastar leitura):
 *   1) "locked" — sem o check-in do sorteio (QR mostrado pela organização NO evento): sem formulário.
 *      `?checkin=<código>` na URL faz o check-in (o código é o do QR, que muda a cada minuto, ver
 *      features/raffle-session.js) e limpa o parâmetro. Se o banco recusar, a tela diz por quê: o código
 *      expirou (escaneie de novo) ou faltou internet.
 *   2) "signup" — com check-in, ainda não cadastrado: formulário.
 *   3) "done" — já cadastrado: confirmação.
 * A regra do Firestore (raffle-entries) EXIGE o check-in do sorteio pra criar o cadastro — é isso que garante
 * de verdade que não dá pra se cadastrar antes do evento nem sem estar lá, não só a tela.
 */
const RAFFLE_ENTRY_KEY = "raffle";

/**
 * `requireTicket` (data/raffle-config.js, espelho de `raffleRequiresTicket()` nas regras): pede o e-mail do ingresso do
 * Sympla e cadastra UM por ingresso: o id do cadastro é a chave da inscrição (email-hash.js, a mesma do cartão
 * "Eu vou!"), então o mesmo e-mail em 2 aparelhos cai no mesmo documento e o banco recusa o segundo.
 *   registrations  repository de consulta das inscrições (`get(chave)`); toKey(edition, email) = registrationKey.
 */
function initRaffleSignup(rootEl, { myRaffle, myRaffleCheckin, requireTicket = false, registrations = () => window.registrationsRepository, toKey = registrationKey, edition = CURRENT_EDITION, rules = raffleRulesRepository.getAll(), whenReady = runAfterModules }) {
  const phaseNow = () => {
    if (myRaffle.has(RAFFLE_ENTRY_KEY)) return "done";
    return myRaffleCheckin.has(RAFFLE_ENTRY_KEY) ? "signup" : "locked";
  };

  function render(containerEl, notice = "") {
    if (!containerEl) return;
    containerEl.dataset.raffleSignupContainer = "";
    containerEl.innerHTML = raffleSignupMarkup({ phase: phaseNow(), notice, requireTicket });
    renderInfoCards(rules.filter(rule => requireTicket || !rule.requiresTicket).map(rule => ({ ...rule, id: rule.title, icon: iconMarkup(rule.icon) })), document.getElementById("raffleRules"));
  }

  /** Grava o check-in do sorteio com o código do QR. "permission-denied" tem duas causas: o check-in já existia
   * (a regra recusa o segundo, e só o próprio documento da pessoa diz isso) ou o código expirou/é inválido. */
  async function doCheckin(code) {
    const uid = await window.firebaseClient.ensureAnonymousUid();
    try {
      await window.raffleCheckinsRepository.add(uid, RAFFLE_ENTRY_KEY, { entryKey: RAFFLE_ENTRY_KEY, code });
    } catch (error) {
      if (error.code !== "permission-denied") throw error;
      if (!(await window.raffleCheckinsRepository.has(uid, RAFFLE_ENTRY_KEY))) return "expired";
    }
    myRaffleCheckin.addAll([RAFFLE_ENTRY_KEY]);
    return "";
  }

  async function handleCheckinParam(containerEl) {
    const code = getParam("checkin");
    if (!code) return;
    const url = new URL(location.href);
    url.searchParams.delete("checkin");
    history.replaceState(null, "", url);
    const notice = await doCheckin(code).catch(() => "offline"); // sem internet: fica em "locked", a pessoa tenta o QR de novo
    render(containerEl, notice);
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
    const email = requireTicket ? text("email") : "";
    if (requireTicket && !email) return showFormError(formEl, submitBtn, t("raffle.emailRequired", "Digite o e-mail do seu ingresso pra participar."));
    submitBtn.disabled = true;
    try {
      const data = { entryKey: RAFFLE_ENTRY_KEY, firstName, lastName };
      if (requireTicket) {
        const key = await toKey(edition, email);
        if (!(await registrations().get(key))) {
          submitBtn.disabled = false;
          return showFormError(formEl, submitBtn, t("raffle.ticketNotFound", "Não encontramos inscrição com esse e-mail. Se você acabou de se inscrever, aguarde até 10 minutos e tente de novo."));
        }
        await window.raffleEntriesRepository.addWithId(key, data);
      } else {
        const uid = await window.firebaseClient.ensureAnonymousUid();
        await window.raffleEntriesRepository.add(uid, RAFFLE_ENTRY_KEY, data);
      }
      myRaffle.addAll([RAFFLE_ENTRY_KEY]);
      render(container);
    } catch (error) {
      // "permission-denied" aqui é a regra recusando um 2º cadastro (já existia): trata como participando, não como erro.
      // Com o ingresso, a inscrição já foi conferida acima, então o motivo só pode ser esse ingresso já estar cadastrado.
      if (error.code === "permission-denied") {
        myRaffle.addAll([RAFFLE_ENTRY_KEY]);
        render(container, requireTicket ? "ticket-already" : "");
        return;
      }
      submitBtn.disabled = false;
      showFormError(formEl, submitBtn, t("raffle.sendError", "Não foi possível enviar agora. Confira sua conexão e tente de novo."));
    }
  });

  whenReady(() => handleCheckinParam(rootEl));

  return { render };
}
