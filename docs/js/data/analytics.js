/**
 * Configuração de medição de uso. Sem endpoint, nada é carregado nem
 * enviado (o site funciona igual). GoatCounter (gratuito, sem cookies,
 * sem dados pessoais) ligado na conta "gdgcampinas": o painel fica em
 * https://gdgcampinas.goatcounter.com. Para desligar, esvaziar `endpoint`.
 * Para outro projeto/evento, criar um site novo na conta (Settings > Sites)
 * e usar o endpoint dele.
 * Trocar de provedor (ex.: Google Analytics) = adicionar um adapter em
 * features/analytics.js e mudar `provider` aqui; nenhuma tela muda.
 */
const ANALYTICS = {
  provider: "goatcounter",
  endpoint: "https://gdgcampinas.goatcounter.com/count", // conta gdgcampinas (vale para outros eventos: Settings > Sites)
  notice: "Medimos as visitas de forma anônima, sem cookies.",
};

const analyticsRepository = createRepository(ANALYTICS);
