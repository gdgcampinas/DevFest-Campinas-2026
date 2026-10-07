/**
 * Configuração do MURAL do telão (mural.html). Só números e endereços, nada de lógica: o motor (features/mural.js), o vigia
 * (features/mural-health.js), a rede e o palco leem daqui. Tempos em milissegundos, salvo `*Seconds`.
 *
 *   prepareTimeoutMs     quanto uma cena pode demorar pra preparar (foto, leitura) antes de ser pulada
 *   failureCooldownMs    cena que falhou descansa esse tempo antes de tentar de novo; skipCooldownMs = a que não tinha nada pra mostrar
 *   reserveSeconds       quanto a cena de reserva fica no ar antes de o mural tentar as outras de novo
 *   watchdogSlackMs      folga que o vigia dá além da duração da cena antes de dizer "travou"
 *   health               quando recarregar (ver features/mural-health.js): falhas seguidas, recarga preventiva, trava anti-laço, volta da internet
 *   network              sonda de internet (um endereço minúsculo de fora do site) e espera crescente entre tentativas
 *   stage                margem segura (%) e as formas do palco por proporção, do mais largo ao mais alto (data-shape; o CSS escolhe o desenho)
 */
const MURAL_CONFIG = {
  defaultSeconds: 12,
  transitionMs: 700,
  prepareTimeoutMs: 8000,
  failureCooldownMs: 2 * 60000,
  skipCooldownMs: 60000,
  retryDelayMs: 500,
  reserveSeconds: 20,
  watchdogSlackMs: 6000,
  imageTimeoutMs: 6000,
  photoQuarantineMs: 10 * 60000,
  clockEveryMs: 1000,
  kioskEnsureEveryMs: 60000,
  health: {
    checkEveryMs: 5000,
    maxConsecutiveFailures: 6,
    preventiveReloadMs: 2 * 3600000,
    reloadStormWindowMs: 10 * 60000,
    reloadStormMax: 3,
    offlineReloadAfterMs: 10 * 60000,
    versionCheckEveryMs: 10 * 60000,
  },
  network: {
    probeUrl: "https://www.gstatic.com/generate_204",
    probeEveryMs: 30000,
    probeTimeoutMs: 5000,
    backoff: { baseMs: 2000, maxMs: 60000, factor: 2, jitter: 0.3 },
  },
  stage: {
    safeMarginPct: 2,
    shapes: [
      { id: "ultrawide", minRatio: 2.4 },
      { id: "wide", minRatio: 1.5 },
      { id: "standard", minRatio: 1.1 },
      { id: "tall", minRatio: 0 },
    ],
  },
};

const muralConfigRepository = createRepository(MURAL_CONFIG);
