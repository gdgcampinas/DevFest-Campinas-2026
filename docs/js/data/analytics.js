/**
 * Configuração de medição de uso. Sem endpoint, nada é carregado nem
 * enviado (o site funciona igual). Para ligar o GoatCounter (gratuito,
 * sem cookies, sem dados pessoais):
 *   1. criar o site em goatcounter.com (ex.: código "devfestcampinas")
 *   2. preencher `endpoint` com "https://devfestcampinas.goatcounter.com/count"
 * Trocar de provedor (ex.: Google Analytics) = adicionar um adapter em
 * features/analytics.js e mudar `provider` aqui; nenhuma tela muda.
 */
const ANALYTICS = {
  provider: "goatcounter",
  endpoint: "",
  notice: "Medimos as visitas de forma anônima, sem cookies.",
};

const analyticsRepository = createRepository(ANALYTICS);
