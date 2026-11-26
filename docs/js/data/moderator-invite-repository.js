/**
 * Repository do ENVIO do convite de moderador: o app da web do Google (DevFestIA/tools/invite-mailer/Code.gs) que manda o e-mail pela conta do GDG. Tudo por parâmetro: `url` (o endereço `/exec`),
 * `getToken()` (o login de quem pede, conferido pelo script) e `fetchImpl`. `send` devolve os e-mails que saíram; recusa vira erro com `code` (o do script, ou "network") e `sent` (quem já tinha recebido antes da falha).
 */
function createModeratorInviteRepository({ url, getToken, fetchImpl = (...args) => fetch(...args) }) {
  const failure = (code, sent = []) => Object.assign(new Error(`convite não enviado (${code})`), { code, sent });
  return createRepository(null, {
    async send({ emails, subject, body }) {
      let result;
      try {
        // text/plain de propósito: pedido "simples", sem a pré-checagem de CORS que o Apps Script não responde
        const response = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ idToken: await getToken(), emails, subject, body }) });
        result = await response.json();
      } catch {
        throw failure("network");
      }
      if (!result?.ok) throw failure(result?.error ?? "network", result?.sent);
      return result.sent;
    },
  });
}
