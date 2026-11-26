/**
 * Feature: convite de moderador pelo Gmail. Só monta o endereço da tela de escrever já preenchida (nada é enviado pelo site). Puro e dual (navegador e Node); a regra de liberação
 * é a de sempre (features/release-gate.js), recebida por parâmetro.
 */

/**
 * `invite` = { composeUrl, subject, body } (data/admin-sections.js); `emails` = quem recebe; `sender` = a conta logada, que envia; `adminUrl` entra no lugar de `{url}`.
 * Um destinatário vai em `to`; vários vão em cópia oculta (`to` = quem envia, e ele sai da cópia), pra ninguém ver o e-mail dos outros. Sem destinatário, "".
 */
function moderatorInviteUrl({ invite, emails, sender = "", adminUrl }) {
  const others = emails.filter(email => email !== sender);
  const recipients = others.length ? others : emails;
  if (recipients.length === 0) return "";
  const single = recipients.length === 1;
  const params = new URLSearchParams({ view: "cm", fs: "1", ...(sender && { authuser: sender }), to: single ? recipients[0] : sender, ...(!single && { bcc: recipients.join(",") }), su: invite.subject, body: invite.body.replaceAll("{url}", adminUrl) });
  return `${invite.composeUrl}?${params}`;
}

/** O que a tela de Moderadores usa ({ text, urlFor(emails) }), ou `null` enquanto o convite não está liberado (`released`). */
function createModeratorInvite({ invite, released, sender, adminUrl }) {
  if (!invite || !released) return null;
  return { text: invite, urlFor: emails => moderatorInviteUrl({ invite, emails, sender, adminUrl }) };
}

/** O convite com os dados do site: o endereço do admin desta publicação e o modo DEV do aparelho. */
function defaultModeratorInvite(sender) {
  const { invite } = adminModeratorsRepository.getAll();
  return createModeratorInvite({ invite, released: isReleased(invite, { devMode: devLineupRequested() }), sender, adminUrl: new URL("admin.html", document.baseURI).href });
}

if (typeof module !== "undefined") module.exports = { moderatorInviteUrl, createModeratorInvite };
