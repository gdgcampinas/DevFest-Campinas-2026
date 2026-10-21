/**
 * Textos do topo da página de ingressos, só dado: selo, título (cada palavra com a sua cor de token), frase de apoio e os 3 passos até a inscrição. Traduzido por igualdade (data/i18n/en.js).
 * Nada daqui é HTML: components/tickets-hero.js escapa tudo.
 */
const TICKETS_HERO_TEXTS = {
  badge: "INGRESSOS ABERTOS",
  lead: "Garanta a sua vaga no",
  brand: [
    { text: "DevFest", color: "var(--google-blue)" },
    { text: "Campinas", color: "var(--google-yellow)" },
    { text: "2026", color: "var(--google-green)" },
  ],
  sub: "Um dia inteiro de tecnologia, aprendizado e gente boa. Escolha o seu ingresso e se inscreva pelo Sympla.",
  steps: [
    { title: "Escolha o ingresso", hint: "Grátis ou com camiseta", color: "var(--google-blue)" },
    { title: "Inscreva-se no Sympla", hint: "Leva menos de 2 minutos", color: "var(--google-yellow)" },
    { title: "Gere o seu cartão", hint: "E convide a galera", color: "var(--google-green)" },
  ],
};

const ticketsHeroTextsRepository = createRepository(TICKETS_HERO_TEXTS);
