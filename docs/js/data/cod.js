/**
 * Código de conduta — PROD. Texto/contatos por parâmetro, nada
 * hardcoded em HTML: trocar o texto não exige tocar em markup/CSS.
 * `rules` reusa o mesmo card com ícone de info-card.js (padrão de "Sobre"/"Antes de vir"), uma cor da
 * marca por regra (data/tokens.css) só pra dar ritmo visual, sem significado próprio por cor.
 * `contact` reusa CONTACT (data/contact.js) — não repete e-mail/Linktree aqui.
 */
const CODE_OF_CONDUCT = {
  title: "Código de conduta",
  intro: "O DevFest Campinas é um evento aberto, respeitoso e inclusivo. Não toleramos assédio de nenhum tipo. Isso vale pra todo mundo: participantes, palestrantes, organizadores e patrocinadores.",
  rules: [
    {
      trackColor: "var(--google-blue)",
      icon: "shield",
      title: "Respeito sempre",
      body: "Piadas ou comentários ofensivos sobre gênero, orientação sexual, raça, religião, nacionalidade ou corpo não são bem-vindos.",
    },
    {
      trackColor: "var(--google-red)",
      icon: "shield",
      title: "Espaço seguro",
      body: "Contato físico não solicitado não é permitido.",
    },
    {
      trackColor: "var(--google-yellow)",
      icon: "shield",
      title: "Consentimento",
      body: "Continuar interagindo com alguém depois que essa pessoa pediu pra parar não é permitido.",
    },
    {
      trackColor: "var(--google-green)",
      icon: "shield",
      title: "Consequências",
      body: "Comportamento fora dessas regras pode resultar em expulsão do evento, sem reembolso.",
    },
  ],
  contact: {
    title: "Fale com a gente",
    body: "Se algo sair do combinado, ou se você só quiser conversar, fala com a organização por qualquer um destes canais.",
  },
};

const codRepository = createRepository(CODE_OF_CONDUCT);
