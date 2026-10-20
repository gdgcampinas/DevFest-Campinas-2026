/**
 * "Acabei de comprar": quem se inscreveu agora ainda não está nos dados do site (o sync do Sympla roda no GitHub). `requestSync()` pede ao Worker pra rodar o job já (sem esperar o agendamento) e
 * `confirm(check)` pede e repete `check()` (a consulta da inscrição) a cada `pollMs` até achar ou acabar `waitMs`. Devolve true se achou. Tudo injetável (rede, espera, relógio), então o teste roda
 * sem navegador de verdade. Usado pelo cartão "Eu vou!" (registration-gate.js) e pelo cadastro do sorteio (raffle-signup.js): um código só.
 */
function createRegistrationSync({ syncUrl = "", fetchFn = (...args) => fetch(...args), wait = ms => new Promise(resolve => setTimeout(resolve, ms)), now = () => Date.now(), waitMs = 90000, pollMs = 6000 } = {}) {
  async function requestSync() {
    if (!syncUrl) return false;
    try {
      return (await fetchFn(syncUrl, { method: "POST" })).ok; // 202 disparou; 429 rodou há pouco (também serve: o job já está a caminho)
    } catch {
      return false;
    }
  }

  async function confirm(check) {
    await requestSync();
    const end = now() + waitMs;
    while (now() < end) {
      await wait(pollMs);
      if (await check()) return true;
    }
    return false;
  }

  return { requestSync, confirm };
}

if (typeof module !== "undefined") module.exports = { createRegistrationSync };
