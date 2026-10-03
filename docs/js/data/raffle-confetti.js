/**
 * Papel picado do sorteio (cai quando o ganhador é revelado; features/confetti.js desenha, features/confetti-engine.js
 * calcula). Tudo aqui é número/cor, nada fixo no motor:
 *   burstCount / rainCount   quantos pedaços saem do cartão do ganhador / caem do topo da tela
 *   ttlMs                    quanto cada pedaço vive (varia ±20%), em ms
 *   rainSpreadMs             a chuva começa escalonada ao longo desse tempo, não tudo de uma vez
 *   gravity / terminalVelocity / airDrag   física (px/s², px/s, 1/s): papel cai devagar e flutua
 *   burstSpeed [min,max]     velocidade da explosão (px/s);  burstSpreadDeg  abertura do leque pra cima
 *   size [min,max]           lado maior do pedaço (px); o menor é ~45% disso
 *   colorVars / fallbackColors   cores da marca lidas de data/tokens.css; se não existirem, as de reserva
 */
const RAFFLE_CONFETTI = {
  burstCount: 120,
  rainCount: 100,
  ttlMs: 4200,
  rainSpreadMs: 1400,
  gravity: 1100,
  terminalVelocity: 380,
  airDrag: 0.9,
  burstSpeed: [520, 1050],
  burstSpreadDeg: 75,
  size: [9, 17],
  colorVars: ["--google-blue", "--google-red", "--google-yellow", "--google-green"],
  fallbackColors: ["#3186FF", "#FC413D", "#FFEC00", "#00AF57"],
};

const raffleConfettiRepository = createRepository(RAFFLE_CONFETTI);
