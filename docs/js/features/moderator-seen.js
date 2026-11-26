/**
 * Feature: "quem aceitou o convite" = quem já ENTROU numa tela de moderação (admin, perguntas, controle do telão, fotos, sorteio). O registro fica no LOGIN (features/moderator-login.js), um ponto só pra todas as
 * telas. Quem pode gravar é decidido pelas regras do Firestore (só o moderador cadastrado, no próprio documento de `moderator-seen`): o dono e a conta de fora são recusados em silêncio.
 * Registrar nunca atrapalha a entrada: não é esperado e a falha (rede, regra) é ignorada. Tudo por parâmetro: `repository` ({ set(id, data) }).
 */
const recordedModerators = new Set(); // uma gravação por pessoa em cada abertura de página

async function recordModeratorSeen({ email, repository }) {
  const id = String(email ?? "").toLowerCase();
  if (!repository || !id || recordedModerators.has(id)) return false;
  recordedModerators.add(id);
  try {
    await repository.set(id, { email: id });
    return true;
  } catch {
    recordedModerators.delete(id); // a próxima entrada tenta de novo
    return false;
  }
}

/** O mesmo `login` ({ signIn, restore, signOut }) que registra quem entrou; `repository()` é lido só na hora (os módulos do Firebase carregam depois). */
function withModeratorSeen(login, repository) {
  const record = async entering => {
    const email = await entering;
    recordModeratorSeen({ email, repository: repository() });
    return email;
  };
  return { ...login, signIn: () => record(login.signIn()), restore: () => record(login.restore()) };
}

if (typeof module !== "undefined") module.exports = { recordModeratorSeen, withModeratorSeen };
