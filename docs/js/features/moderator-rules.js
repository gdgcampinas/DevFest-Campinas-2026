/**
 * Regras PURAS da lista de moderadores (a tela do admin, seção Moderadores): como o e-mail é limpo e validado e como a lista muda. Dual (navegador e Node). O documento no Firestore é
 * `moderators/<e-mail em minúsculas>` com { email, addedBy }; as regras do Firestore repetem a validação (a regra é a defesa, esta função só avisa antes).
 */
const MODERATOR_EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MODERATOR_EMAIL_MAX = 254;

/** O e-mail como é guardado: sem espaços nas pontas e em minúsculas (o login do Google devolve em minúsculas). */
const normalizeModeratorEmail = text => String(text ?? "").trim().toLowerCase();

/** Devolve o e-mail limpo ou lança um erro com o motivo em português. */
function validateModeratorEmail(text) {
  const email = normalizeModeratorEmail(text);
  if (!email) throw new Error("escreva o e-mail");
  if (email.length > MODERATOR_EMAIL_MAX || !MODERATOR_EMAIL_PATTERN.test(email)) throw new Error("e-mail inválido");
  return email;
}

/**
 * O documento a gravar pra cadastrar `text`, ou erro: e-mail inválido, já cadastrado ou lista cheia (`max`). `list` = os moderadores atuais [{ id }]; `addedBy` = e-mail de quem cadastra.
 */
function buildModeratorToAdd({ text, list, addedBy, max }) {
  const email = validateModeratorEmail(text);
  if (list.some(item => item.id === email)) throw new Error("esse e-mail já é moderador");
  if (list.length >= max) throw new Error(`a lista já tem ${max} moderadores`);
  return { id: email, data: { email, addedBy: normalizeModeratorEmail(addedBy) } };
}

/** A lista em ordem alfabética de e-mail (a leitura do banco não garante ordem). */
const sortModerators = list => [...list].sort((a, b) => a.id.localeCompare(b.id));

if (typeof module !== "undefined") module.exports = { normalizeModeratorEmail, validateModeratorEmail, buildModeratorToAdd, sortModerators, MODERATOR_EMAIL_PATTERN, MODERATOR_EMAIL_MAX };
