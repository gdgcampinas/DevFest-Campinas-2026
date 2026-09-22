/**
 * Feature: check-in + avaliação de palestra sobre o Firestore
 * (checkinRepository/feedbackRepository, ver data/firebase-*.js).
 * `index` é o mesmo buildTalkIndex() já usado por calendar-actions.js
 * (entry.code é o código curto tipo "0945.ia", usado tanto no link de
 * agenda compartilhada quanto no QR code de check-in — mesmo sistema,
 * dois usos, ver features/checkin-display.js).
 *
 * Duas entradas de check-in:
 *   1) `?checkin=<code>` na URL (QR escaneado ou link) — automático, ao carregar a página.
 *   2) botão manual dentro do modal (honra, pra quem não tem câmera à mão).
 * As duas chamam a mesma função, sem duplicar lógica.
 *
 * O bloco renderizado (components/talk-feedback.js) sempre fica dentro
 * de um elemento com `data-feedback-container="<entryKey>"` — é assim
 * que os handlers delegados (clique no check-in, submit do formulário)
 * sabem de qual palestra re-renderizar depois de agir, sem precisar
 * guardar estado em variável nenhuma.
 *
 * `window.firebaseClient`/`window.checkinRepository`/`window.feedbackRepository`
 * só existem depois que os módulos do SDK rodam (`type="module"`, sempre
 * adiado pra depois do parsing — ver nota em firebase-client.js). Por
 * isso esta função NUNCA os lê no próprio corpo de initTalkFeedback()
 * (que roda no bootstrap síncrono da página); só dentro dos handlers,
 * que só disparam depois que a pessoa já pode clicar em algo — ponto em
 * que os módulos garantidamente já terminaram.
 */
function initTalkFeedback(rootEl, { index, reveal = true, now = () => new Date() }) {
  async function doCheckin(entry) {
    const uid = await window.firebaseClient.ensureAnonymousUid();
    try {
      await window.checkinRepository.add(uid, entry.key, { entryKey: entry.key });
    } catch {
      /* já tinha feito check-in — segue o fluxo normal, sem tratar como erro */
    }
  }

  /** Resolve o estado atual (checkin -> waiting -> rate -> done) pra uma entrada. */
  async function resolveState(entry) {
    const uid = await window.firebaseClient.ensureAnonymousUid();
    const checkedIn = await window.checkinRepository.has(uid, entry.key).catch(() => false);
    if (!checkedIn) return { phase: "checkin", entryKey: entry.key };
    if (entry.slot.end > now()) return { phase: "waiting", entryKey: entry.key };
    const rated = await window.feedbackRepository.has(uid, entry.key).catch(() => false);
    return { phase: rated ? "done" : "rate", entryKey: entry.key };
  }

  /** Preenche containerEl com o bloco de feedback da palestra (chamado pelo talk-modal ao abrir). */
  async function render(containerEl, entry) {
    if (!reveal || !containerEl) return;
    containerEl.dataset.feedbackContainer = entry.key;
    containerEl.innerHTML = talkFeedbackMarkup({ phase: "loading" });
    const state = await resolveState(entry);
    containerEl.innerHTML = talkFeedbackMarkup(state);
  }

  /**
   * `?checkin=<code>` na URL (QR escaneado ou link): faz o check-in e
   * limpa o parâmetro. Roda sozinho, sem a página precisar chamar nada:
   * agendado pra depois de `DOMContentLoaded`, que só acontece depois
   * que os módulos do Firebase (adiados) já executaram — tocar em
   * `window.firebaseClient` antes disso, ainda no bootstrap síncrono
   * da página, quebraria.
   */
  async function handleCheckinParam() {
    const code = getParam("checkin");
    if (!code) return;
    const entry = index.getByCode(code);
    const url = new URL(location.href);
    url.searchParams.delete("checkin");
    history.replaceState(null, "", url);
    if (entry) await doCheckin(entry);
  }
  if (getParam("checkin")) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", handleCheckinParam);
    else handleCheckinParam();
  }

  // check-in manual pelo botão (honra)
  rootEl.addEventListener("click", async event => {
    const btn = event.target.closest("[data-feedback-checkin]");
    if (!btn) return;
    const container = btn.closest("[data-feedback-container]");
    const entry = index.getAll().find(e => e.key === btn.dataset.entryKey);
    if (!entry || !container) return;
    btn.disabled = true;
    await doCheckin(entry);
    render(container, entry);
  });

  // envio do formulário de avaliação
  rootEl.addEventListener("submit", async event => {
    const form = event.target.closest("[data-feedback-form]");
    if (!form) return;
    event.preventDefault();
    const container = form.closest("[data-feedback-container]");
    const entry = index.getAll().find(e => e.key === form.dataset.entryKey);
    if (!entry || !container) return;
    const submitBtn = form.querySelector("[type=submit]");
    submitBtn.disabled = true;
    const uid = await window.firebaseClient.ensureAnonymousUid();
    const rating = Number(new FormData(form).get(`rating-${entry.key}`));
    const name = form.querySelector("[name=name]").value.trim();
    const highlight = form.querySelector("[name=highlight]").value.trim();
    try {
      await window.feedbackRepository.add(uid, entry.key, {
        entryKey: entry.key,
        rating,
        ...(name ? { name } : {}),
        ...(highlight ? { highlight } : {}),
      });
      container.innerHTML = talkFeedbackMarkup({ phase: "done" });
    } catch {
      submitBtn.disabled = false;
    }
  });

  return { render, handleCheckinParam };
}
