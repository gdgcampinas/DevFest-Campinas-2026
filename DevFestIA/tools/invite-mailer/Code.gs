/**
 * Envio do convite de moderador (Google Apps Script, publicado como App da Web na conta do GDG; passo a passo no README.md). O site (admin > Moderadores) manda
 * { idToken, emails, subject, body }; o e-mail sai da conta que publicou o script, um por pessoa.
 *
 * Quem pode pedir é decidido pelas REGRAS do Firestore: o script lê a lista de moderadores com o login (idToken) de quem pediu, e só o DONO consegue ler. Nenhum e-mail
 * fica escrito aqui e só recebe quem está nessa lista. Nada de senha ou chave no código.
 */
var PROJECT_ID = "devfest-campinas";
var SENDER_NAME = "GDG Campinas";
var LIMITS = { recipients: 40, subject: 200, body: 4000 };

function doPost(event) {
  var payload = null;
  try {
    payload = JSON.parse(event.postData.contents);
  } catch (error) {
    payload = null;
  }
  var result = handleInvite(payload, { fetcher: UrlFetchApp, mailer: MailApp });
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/** Pedido válido: login, 1 a 40 destinatários, assunto e texto dentro do limite. */
function isValidInvite(payload) {
  var text = function (value, max) { return typeof value === "string" && value.length > 0 && value.length <= max; };
  return Boolean(payload) && text(payload.idToken, 4000) && Array.isArray(payload.emails) && payload.emails.length > 0 && payload.emails.length <= LIMITS.recipients
    && text(payload.subject, LIMITS.subject) && text(payload.body, LIMITS.body);
}

/** Os e-mails cadastrados, ou null quando o login não é o do dono (o banco recusa). */
function listModerators(idToken, fetcher) {
  var url = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID + "/databases/(default)/documents/moderators?pageSize=100";
  var response = fetcher.fetch(url, { headers: { Authorization: "Bearer " + idToken }, muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) return null;
  var documents = JSON.parse(response.getContentText()).documents || [];
  return documents.map(function (item) { return decodeURIComponent(item.name.split("/").pop()).toLowerCase(); });
}

/** Devolve { ok: true, sent } ou { ok: false, error, sent }: error = invalid | not-owner | no-recipient | quota | send-failed. `deps` = { fetcher, mailer }. */
function handleInvite(payload, deps) {
  var fail = function (error, sent) { return { ok: false, error: error, sent: sent || [] }; };
  if (!isValidInvite(payload)) return fail("invalid");
  var moderators = listModerators(payload.idToken, deps.fetcher);
  if (!moderators) return fail("not-owner");
  var targets = payload.emails
    .map(function (email) { return String(email).toLowerCase(); })
    .filter(function (email, index, all) { return all.indexOf(email) === index && moderators.indexOf(email) !== -1; });
  if (targets.length === 0) return fail("no-recipient");
  if (deps.mailer.getRemainingDailyQuota() < targets.length) return fail("quota");
  var sent = [];
  try {
    targets.forEach(function (email) {
      deps.mailer.sendEmail({ to: email, subject: payload.subject, body: payload.body, name: SENDER_NAME });
      sent.push(email);
    });
  } catch (error) {
    return fail("send-failed", sent);
  }
  return { ok: true, sent: sent };
}

if (typeof module !== "undefined") module.exports = { handleInvite: handleInvite, LIMITS: LIMITS };
