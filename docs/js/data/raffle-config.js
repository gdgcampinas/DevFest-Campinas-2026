/**
 * Configuração do sorteio.
 *   requireTicket  true = o cadastro pede o e-mail do ingresso do Sympla e vale UM cadastro por ingresso (mesmo e-mail em 2
 *                  celulares = 1 cadastro só); false = um cadastro por aparelho, sem ingresso (teste em DEV, antes de haver
 *                  inscritos). LIGAR ANTES DO EVENTO, junto com `raffleRequiresTicket()` das regras do Firestore (um teste
 *                  confere que são iguais). Só liga com o job do Sympla rodando (as inscrições vêm de `registrations`).
 *   resetWord      a palavra que o moderador digita pra confirmar o "Resetar sorteios" (apaga os sorteios feitos, devolve todo
 *                  mundo pra roleta; os cadastros ficam).
 */
const RAFFLE_CONFIG = {
  requireTicket: false,
  resetWord: "RESETAR",
};

const raffleConfigRepository = createRepository(RAFFLE_CONFIG);
