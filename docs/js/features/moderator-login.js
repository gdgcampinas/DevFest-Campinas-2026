/**
 * Login do moderador (conta Google, window.moderatorClient) — extraído de features/question-moderation.js
 * pra ser reusado por qualquer tela de moderação (perguntas, sorteio): a mensagem de erro de cada código do
 * Firebase Auth é a mesma em qualquer tela.
 */
const SIGNIN_ERROR_HINTS = {
  "auth/popup-blocked": "O navegador bloqueou a janela do Google. Libere os pop-ups deste site e tente de novo.",
  "auth/popup-closed-by-user": "A janela do Google foi fechada antes de terminar. Tente de novo.",
  "auth/cancelled-popup-request": "Já havia uma janela de login aberta. Feche as janelas do Google e tente de novo.",
  "auth/unauthorized-domain": "Este endereço não está autorizado no Firebase (Authentication > Configurações > Domínios autorizados).",
  "auth/operation-not-allowed": "O login com Google não está ativado no Firebase (Authentication > Método de login).",
  "auth/network-request-failed": "Sem conexão com o Firebase. Confira a internet.",
};

const signInErrorMessage = error => `${SIGNIN_ERROR_HINTS[error?.code] ?? "Não foi possível entrar. Tente de novo."} (${error?.code ?? "erro desconhecido"})`;

/** Repository padrão do login de moderador: sempre window.moderatorClient (só troca em teste). */
function defaultModeratorLoginDeps() {
  return {
    signIn: () => window.moderatorClient.signInWithGoogle(),
    restore: () => window.moderatorClient.restoreModerator(),
    signOut: () => window.moderatorClient.signOutModerator(),
  };
}
