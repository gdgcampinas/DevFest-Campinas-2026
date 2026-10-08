/**
 * Configuração do MURAL do telão (mural.html). Só números e endereços, nada de lógica: o motor (features/mural.js), o vigia
 * (features/mural-health.js), a rede e o palco leem daqui. Tempos em milissegundos, salvo `*Seconds`.
 *
 *   speakerPhotoTimeoutMs foto de palestrante que passar disso vira iniciais (a cena "rolando agora" não espera foto lenta)
 *   prepareTimeoutMs     quanto uma cena pode demorar pra preparar (foto, leitura) antes de ser pulada
 *   failureCooldownMs    cena que falhou descansa esse tempo antes de tentar de novo; skipCooldownMs = a que não tinha nada pra mostrar
 *   reserveSeconds       quanto a cena de reserva fica no ar antes de o mural tentar as outras de novo (se a falha foi da própria reserva)
 *   idleRetryMs          com a reserva no ar porque NADA estava disponível (dado ao vivo ainda chegando), de quanto em quanto tempo o mural olha de novo, sem redesenhar a reserva
 *   watchdogSlackMs      folga que o vigia dá além da duração da cena antes de dizer "travou"
 *   health               quando recarregar (ver features/mural-health.js): falhas seguidas, recarga preventiva, trava anti-laço, volta da internet
 *   network              sonda de internet (um endereço minúsculo de fora do site) e espera crescente entre tentativas
 *   motion               animações, todas por dado: `defaultTransition` (entrada das cenas: "rise", "slide" ou "zoom"; cada cena pode trocar com `transition`),
 *                        `staggerMs` (espera entre um cartão e o seguinte quando entram em sequência), `podiumStepMs` (espera entre um lugar do pódio e o seguinte,
 *                        do último pro primeiro), `countUpMs`/`countUpStepMs` (número que sobe). Só opacity e transform (roda na placa de vídeo, não pesa em computador fraco)
 *   holdCheckMs          com o rodízio parado numa cena (fixar, pausar, emergência) de quanto em quanto tempo o motor olha se o prazo acabou (e renova o prazo do vigia)
 *   control              controle remoto do mural (features/mural-control.js): `docKey` (documento `mural-control/<docKey>`), limites de aviso (`maxNotices`, `maxTextLength`, `maxEmergencyLength`),
 *                        as durações que o moderador escolhe (`noticeMinutes`, `holdMinutes`) e a que já vem marcada (`noticeDefaultMinutes`, `holdDefaultMinutes`) e o que o mural faz com o aviso novo (`emergencyScene`, `noticeInterrupt`)
 *   video                vídeos (data/mural-videos.js): `path` = rota do intermediário que entrega os clipes (junto de `albums.proxyUrl`; `?videos=<endereço>` na URL troca só pra teste), `cacheName` = nome
 *                        no Cache Storage do navegador, `retryMs` = quanto esperar pra tentar de novo um clipe que falhou, `slackSeconds` = folga somada à duração do clipe
 *   albums               álbuns do Google Fotos (data/mural-albums.js): `proxyUrl` = endereço do intermediário (DevFestIA/tools/album-proxy, publicado como Cloudflare Worker na conta do GDG; VAZIO = álbuns desligados, o mural segue
 *                        sem cenas de foto; `?albuns=<endereço>` na URL liga só pra teste), `timeoutMs` = quanto esperar o intermediário, `quarantineMs` = quanto uma foto que
 *                        não carregou fica de fora
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
  idleRetryMs: 5000,
  holdCheckMs: 5000,
  watchdogSlackMs: 6000,
  imageTimeoutMs: 6000,
  speakerPhotoTimeoutMs: 2500,
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
  control: {
    docKey: "current",
    maxNotices: 5,
    maxTextLength: 140,
    maxEmergencyLength: 160,
    noticeMinutes: [1, 2, 5, 15, 60],
    noticeDefaultMinutes: 5,
    holdMinutes: [5, 15, 30, 60],
    holdDefaultMinutes: 15,
    emergencyScene: "emergencia",
    noticeInterrupt: { sceneId: "aviso", priority: 90, ttlMs: 60000, immediate: true },
  },
  video: {
    path: "/media/",
    cacheName: "devfest-mural-video-v1",
    retryMs: 30000,
    slackSeconds: 0.6,
  },
  albums: {
    proxyUrl: "https://devfest-album-proxy.gdgcampinas-devfest.workers.dev",
    timeoutMs: 8000,
    quarantineMs: 10 * 60000,
  },
  motion: {
    defaultTransition: "rise",
    staggerMs: 120,
    podiumStepMs: 900,
    countUpMs: 1800,
    countUpStepMs: 40,
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
