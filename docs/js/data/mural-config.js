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
 *   motion               animações, todas por dado: `defaultTransition` (entrada das cenas: "rise", "slide" ou "zoom"; cada cena pode trocar com `transition`),
 *                        `staggerMs` (espera entre um cartão e o seguinte quando entram em sequência), `podiumStepMs` (espera entre um lugar do pódio e o seguinte,
 *                        do último pro primeiro), `countUpMs`/`countUpStepMs` (número que sobe), `kenBurns` (zoom lento das fotos: ponto de origem e escala inicial/final,
 *                        em rodízio a cada foto). Só opacity e transform (roda na placa de vídeo, não pesa em computador fraco)
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
  motion: {
    defaultTransition: "rise",
    staggerMs: 120,
    podiumStepMs: 900,
    countUpMs: 1800,
    countUpStepMs: 40,
    kenBurns: [
      { origin: "50% 50%", from: 1, to: 1.08 },
      { origin: "30% 40%", from: 1.1, to: 1 },
      { origin: "70% 60%", from: 1, to: 1.09 },
      { origin: "50% 30%", from: 1.08, to: 1 },
    ],
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
