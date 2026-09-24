/**
 * Quiz "Monte sua trilha": perguntas e o peso de cada resposta por trilha.
 * Só dado, sem DOM. Os ids em `weights` são ids de TRACKS (schedule.js);
 * trilha nova entra aqui só ganhando peso nas respostas. Trocar pergunta,
 * resposta ou peso é editar este arquivo, nada mais.
 */
const QUIZ_QUESTIONS = [
  {
    id: "pace",
    text: "Qual assunto te faz abrir uma aba nova agora?",
    answers: [
      { id: "ai", label: "Um modelo de IA que faz algo surpreendente", weights: { ia: 3 } },
      { id: "app", label: "Um app bonito e rápido no celular", weights: { mobile: 3 } },
      { id: "arch", label: "Como um sistema aguenta milhões de acessos", weights: { webdata: 3 } },
      { id: "career", label: "Como alguém chegou onde eu quero chegar", weights: { mentoring: 3 } },
    ],
  },
  {
    id: "stage",
    text: "Em que momento da carreira você está?",
    answers: [
      { id: "start", label: "Começando ou em transição", weights: { mentoring: 2, mobile: 1 } },
      { id: "mid", label: "Já entrego, quero me aprofundar", weights: { webdata: 2, ia: 1 } },
      { id: "senior", label: "Sênior, quero ver o que vem por aí", weights: { ia: 2, webdata: 1 } },
      { id: "lead", label: "Lidero pessoas ou times", weights: { mentoring: 2, mobile: 1 } },
    ],
  },
  {
    id: "format",
    text: "Que tipo de conversa você prefere?",
    answers: [
      { id: "demo", label: "Demo ao vivo, mão no código", weights: { ia: 1, mobile: 2 } },
      { id: "deep", label: "Mergulho técnico de arquitetura", weights: { webdata: 3 } },
      { id: "story", label: "História real, com erros e acertos", weights: { mentoring: 3 } },
      { id: "trend", label: "Panorama do que está mudando", weights: { ia: 2, webdata: 1 } },
    ],
  },
  {
    id: "tool",
    text: "Qual ferramenta você mais gostaria de dominar?",
    answers: [
      { id: "agents", label: "Agentes e APIs de IA", weights: { ia: 3 } },
      { id: "cross", label: "Flutter, Kotlin ou Swift", weights: { mobile: 3 } },
      { id: "cloud", label: "Banco de dados, nuvem e pipelines", weights: { webdata: 3 } },
      { id: "agile", label: "Métodos ágeis e produto", weights: { mobile: 2, mentoring: 1 } },
    ],
  },
  {
    id: "goal",
    text: "O que você quer levar do DevFest?",
    answers: [
      { id: "skill", label: "Uma habilidade nova pra usar na segunda", weights: { webdata: 2, mobile: 1, ia: 1 } },
      { id: "network", label: "Contatos e mentoria", weights: { mentoring: 3 } },
      { id: "future", label: "Ideias sobre o futuro da tecnologia", weights: { ia: 3 } },
      { id: "ship", label: "Como entregar melhor com o meu time", weights: { mobile: 2, mentoring: 1 } },
    ],
  },
];

/** Textos fixos da página; separados das perguntas pra facilitar troca (e tradução). */
const QUIZ_COPY = {
  title: "Monte sua trilha",
  subtitle: "Cinco perguntas rápidas e a gente sugere a trilha do DevFest que mais combina com você.",
  start: "Começar",
  next: "Próxima",
  seeResult: "Ver minha trilha",
  restart: "Refazer o quiz",
  resultLabel: "Sua trilha é",
  alsoFits: "Também combina com",
  suggestedTalks: "Palestras pra você",
  addToAgenda: "Adicionar à minha agenda",
  addedToAgenda: "Adicionadas à sua agenda",
  agendaLink: "Ver minha agenda",
  talksSoon: "As palestras dessa trilha serão reveladas em breve.",
  share: "Copiar link do resultado",
  shared: "Link copiado",
  whatsapp: "Compartilhar no WhatsApp",
  shareMessage: track => `Fiz o quiz do DevFest Campinas 2026 e minha trilha é ${track}!`,
  sharedBanner: track => `Alguém te mostrou a trilha ${track}. Descubra a sua:`,
};

const quizRepository = createRepository({ questions: QUIZ_QUESTIONS, copy: QUIZ_COPY });
