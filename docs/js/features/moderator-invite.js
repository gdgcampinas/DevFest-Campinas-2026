/**
 * Feature: convite de moderador por e-mail. Com um `mailer` (data/moderator-invite-repository.js) o site envia; sem ele, monta o endereço da tela de escrever do Gmail já preenchida.
 * Dual (navegador e Node); a regra de liberação é a de sempre (features/release-gate.js), recebida por parâmetro.
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
  const params = new URLSearchParams({ view: "cm", fs: "1", ...(sender && { authuser: sender }), to: single ? recipients[0] : sender, ...(!single && { bcc: recipients.join(",") }), su: invite.subject, body: moderatorInviteMessage(invite, adminUrl).body });
  return `${invite.composeUrl}?${params}`;
}

/** O assunto e o texto prontos: `adminUrl` entra no lugar de `{url}`. */
const moderatorInviteMessage = (invite, adminUrl) => ({ subject: invite.subject, body: invite.body.replaceAll("{url}", adminUrl) });

/** O que a tela de Moderadores usa, ou `null` enquanto o convite não está liberado (`released`): { text, send(emails) } com `mailer`; sem ele { text, urlFor(emails) }. */
function createModeratorInvite({ invite, released, sender, adminUrl, mailer = null }) {
  if (!invite || !released) return null;
  if (mailer) return { text: invite, send: emails => mailer.send({ emails, ...moderatorInviteMessage(invite, adminUrl) }) };
  return { text: invite, urlFor: emails => moderatorInviteUrl({ invite, emails, sender, adminUrl }) };
}

/** O convite com os dados do site: o endereço do admin desta publicação, o modo DEV do aparelho e, com `sendUrl`, o envio assinado pelo login de quem está no admin. */
function defaultModeratorInvite(sender) {
  const { invite } = adminModeratorsRepository.getAll();
  const mailer = invite.sendUrl ? createModeratorInviteRepository({ url: invite.sendUrl, getToken: () => window.moderatorClient.auth.currentUser.getIdToken() }) : null;
  return createModeratorInvite({ invite, released: isReleased(invite, { devMode: devLineupRequested() }), sender, adminUrl: new URL("admin.html", document.baseURI).href, mailer });
}

if (typeof module !== "undefined") module.exports = { moderatorInviteUrl, createModeratorInvite };
