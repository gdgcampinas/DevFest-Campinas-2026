/**
 * Regras do sorteio, exibidas na aba Sorteio antes do cadastro. Mesmo card com ícone de info-card.js (padrão
 * do Código de conduta), uma cor da marca por regra só pra dar ritmo visual, sem significado próprio por cor.
 */
const RAFFLE_RULES = [
  {
    trackColor: "var(--google-blue)",
    icon: "calendar",
    title: "Só no dia do evento",
    body: "O cadastro abre durante o DevFest, ao vivo, não antes.",
  },
  {
    trackColor: "var(--google-red)",
    icon: "shield",
    title: "Precisa de check-in",
    body: "Escaneie o QR do sorteio no evento pra liberar o cadastro.",
  },
  {
    trackColor: "var(--google-yellow)",
    icon: "check",
    title: "Um ingresso, um cadastro",
    body: "Só quem tem ingresso concorre, e cada ingresso vale uma vez, mesmo com dois celulares.",
    requiresTicket: true, // só aparece quando o cadastro exige o ingresso (data/raffle-config.js)
  },
  {
    trackColor: "var(--google-green)",
    icon: "users",
    title: "Só quem está na sala",
    body: "O prêmio é só de quem estiver presente na hora do sorteio.",
  },
];

const raffleRulesRepository = createRepository(RAFFLE_RULES);
