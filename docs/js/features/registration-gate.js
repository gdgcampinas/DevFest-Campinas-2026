/**
 * Gate de inscrição: "esse e-mail está inscrito no Sympla?" sem servidor
 * do site. O job DevFestIA/tools/sympla-sync grava `registrations/<edição>_<hash>`;
 * aqui o navegador calcula o mesmo hash (email-hash.js, arquivo único) e
 * consulta esse documento. Tudo injetado, sem saber de Firebase:
 *   getRegistrations()   → repository de consulta (função, pra ser lido só
 *                          depois que os módulos do Firebase rodaram)
 *   verifiedRepository   → conjunto persistido de chaves já verificadas
 *   toKey(edition,email) → registrationKey (email-hash.js)
 *   sync                 (opcional, features/registration-sync.js) e-mail ainda não encontrado: mostra "estamos confirmando", pede o sync do Sympla na hora e consulta de novo por até ~90 s
 * Devolve { isVerified, verify, mount }. `mount` desenha o formulário num
 * elemento e chama `onVerified` quando a inscrição é confirmada.
 */
function createRegistrationGate({ getRegistrations, edition, verifiedRepository, toKey = registrationKey, sync = null }) {
  const isVerified = () => verifiedRepository.count() > 0;

  async function verify(email) {
    const key = await toKey(edition, email);
    const record = await getRegistrations().get(key);
    if (!record) return { ok: false };
    verifiedRepository.addAll([key]);
    return { ok: true, ticketName: record.ticketName };
  }

  function mount(containerEl, { onVerified, ticketButtonHtml = "" }) {
    function render(phase) {
      containerEl.innerHTML = registrationGateMarkup({ phase, ticketButtonHtml });
      const form = containerEl.querySelector("[data-registration-gate-form]");
      if (!form) return;
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const email = form.elements.email.value;
        render("checking");
        try {
          let result = await verify(email);
          if (!result.ok && sync) {
            render("confirming");
            await sync.confirm(async () => { result = await verify(email); return result.ok; });
          }
          if (result.ok) onVerified(result);
          else render("not-found");
        } catch {
          render("error");
        }
      });
    }
    render("form");
  }

  return { isVerified, verify, mount };
}
