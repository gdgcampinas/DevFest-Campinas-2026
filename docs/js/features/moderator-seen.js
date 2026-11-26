/**
 * Feature: "quem aceitou o convite" = quem já ENTROU no admin. Puro, tudo por parâmetro: `access` ({ owner, moderator }, features/admin-access.js), `email` (a conta logada) e `repository`
 * ({ set(id, data) }, a coleção `moderator-seen`). Só o moderador que não é o dono é registrado. Registrar nunca atrapalha a entrada: falha (rede, regra ainda não publicada) é ignorada.
 */
async function recordModeratorSeen({ access, email, repository }) {
  const id = String(email ?? "").toLowerCase();
  if (!repository || !id || access?.moderator !== true || access.owner !== false) return false;
  try {
    await repository.set(id, { email: id });
    return true;
  } catch {
    return false;
  }
}

if (typeof module !== "undefined") module.exports = { recordModeratorSeen };
