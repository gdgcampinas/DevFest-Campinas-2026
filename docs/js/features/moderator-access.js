/**
 * Feature: a conta que entrou com o Google é MODERADORA? Entrar é aberto a qualquer conta Google; quem usa a área de moderação (admin, telão, fotos) é só o dono e os moderadores cadastrados. Não repete nenhum
 * e-mail no código: tenta uma leitura que só moderador consegue (`probeModerator`) e olha o que o banco respondeu: leu = é moderadora; "sem permissão" = NÃO é; outro erro (rede) = não sabe. Quem decide de
 * verdade é a regra do Firestore (a tela nunca dá acesso a dado); isto só barra a entrada na tela, em vez de abrir a área vazia pra conta de fora.
 *   probeAllowed(probe)               true | false | null (null = não deu pra saber: rede, etc.)
 *   resolveModeratorAccess({ probeModerator })  { moderator: true | false | null }
 *   moderatorAccessState(access)      "allowed" | "denied" | "unknown" (o que a tela mostra); sem a chave `moderator` (tela sem checagem, como o painel embutido no admin) conta como liberada.
 */
async function probeAllowed(probe) {
  try {
    await probe();
    return true;
  } catch (error) {
    return error?.code === "permission-denied" ? false : null;
  }
}

async function resolveModeratorAccess({ probeModerator }) {
  return { moderator: await probeAllowed(probeModerator) };
}

function moderatorAccessState(access) {
  if (access?.moderator === false) return "denied";
  if (access?.moderator === null) return "unknown";
  return "allowed";
}

/** As dependências de verdade das telas de moderação: a leitura do banco e os textos da tela de bloqueio. */
function defaultModeratorAccessDeps() {
  return {
    access: { resolve: () => resolveModeratorAccess({ probeModerator: () => window.moderatorAccessRepository.probe() }) },
    accessText: moderatorAccessTextsRepository.getAll(),
  };
}

if (typeof module !== "undefined") module.exports = { probeAllowed, resolveModeratorAccess, moderatorAccessState };
