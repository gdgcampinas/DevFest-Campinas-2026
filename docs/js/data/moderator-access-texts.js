/**
 * Textos da tela de BLOQUEIO das áreas de moderação (admin, telão, fotos): entrar com o Google é aberto a qualquer conta, mas só o dono e os moderadores cadastrados usam a área. `{email}` vira a
 * conta que entrou. Só dado: trocar uma frase não mexe em marcação. Usado por components/moderator-access.js; a regra que decide é features/moderator-access.js (e as regras do Firestore).
 */
const MODERATOR_ACCESS_TEXTS = {
  deniedTitle: "Esta conta não está liberada",
  deniedBody: "{email} não está cadastrada como moderadora. Peça à organização (o administrador) para cadastrar este e-mail em Moderadores.",
  switchButton: "Entrar com outra conta",
  unknownTitle: "Não consegui verificar o acesso",
  unknownBody: "Confira a internet e tente de novo.",
  retryButton: "Tentar de novo",
};

const moderatorAccessTextsRepository = createRepository(MODERATOR_ACCESS_TEXTS);
