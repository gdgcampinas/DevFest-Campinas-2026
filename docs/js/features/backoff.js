/**
 * Espera crescente entre tentativas (rede que caiu, escuta do banco que falhou): base * fator^tentativa, limitada a `maxMs`.
 * `jitter` (0..1) tira até essa fração do valor, pra vários aparelhos não baterem no servidor ao mesmo tempo. Pura, dual (navegador e Node).
 */
function backoffDelay(attempt, { baseMs = 2000, maxMs = 60000, factor = 2, jitter = 0 } = {}, random = Math.random) {
  const raw = Math.min(maxMs, baseMs * factor ** Math.max(0, attempt));
  return Math.round(raw * (1 - jitter * random()));
}

if (typeof module !== "undefined") module.exports = { backoffDelay };
