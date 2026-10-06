/**
 * Peças compartilhadas pelos blocos que moram dentro do modal da palestra e conversam com o banco (perguntas ao vivo,
 * concurso da sessão): saber se o bloco ainda está na tela, se a pessoa está digitando, e refazer o check-in quando o banco
 * o recusa. Cada bloco guarda a própria sessão; aqui só entra o que seria copiado igual.
 */

/** Só continua atualizando enquanto o bloco existe e está visível (modal aberto). */
function isBlockOnScreen(containerEl) {
  return containerEl.isConnected && containerEl.getClientRects().length > 0;
}

/** Enquanto a pessoa digita não se redesenha o bloco (perderia o foco e o texto). */
function isTypingInBlock(containerEl) {
  return Boolean(containerEl.querySelector("textarea:focus, input:focus"));
}

/**
 * Roda `action`; se o banco recusar (check-in do uid atual ausente: login trocado, dados do site apagados pela metade),
 * refaz o check-in (`ensureCheckin(entry)`, idempotente) e tenta mais uma vez.
 */
async function withCheckinRetry(ensureCheckin, entry, action) {
  try {
    return await action();
  } catch (error) {
    if (error.code !== "permission-denied") throw error;
    await ensureCheckin(entry);
    return action();
  }
}
