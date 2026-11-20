/**
 * Quiz "Monte sua trilha": perguntas e o peso de cada resposta por ASSUNTO.
 * Só dado, sem DOM. Os ids em `weights` são assuntos de data/talk-topics.js
 * (TALK_TOPICS): o quiz soma os pontos dos assuntos escolhidos, pontua cada
 * palestra pelos assuntos dela e sugere a trilha e a agenda que mais combinam.
 * Trocar pergunta, resposta ou peso é editar este arquivo, nada mais.
 */
const QUIZ_QUESTIONS = [
  {
    id: "pace",
    text: "Qual assunto te faz abrir uma aba nova agora?",
    answers: [
      { id: "ai", label: "Agentes de IA e modelos abertos, como o Gemma", weights: { ia: 3 } },
      { id: "app", label: "Um app bonito e rápido no celular", weights: { mobile: 3 } },
      { id: "arch", label: "Como um banco de dados ou um sistema aguenta milhões de acessos", weights: { dados: 2, arquitetura: 2 } },
      { id: "career", label: "Como alguém construiu a carreira que eu quero", weights: { carreira: 3 } },
      { id: "sec", label: "Como proteger um sistema contra ataques", weights: { seguranca: 3 } },
    ],
  },
  {
    id: "stage",
    text: "Em que momento da carreira você está?",
    answers: [
      { id: "start", label: "Começando ou em transição", weights: { carreira: 3, ia: 1 } },
      { id: "mid", label: "Já entrego, quero me aprofundar", weights: { arquitetura: 2, dados: 1 } },
      { id: "senior", label: "Sênior, quero ver o que vem por aí", weights: { ia: 2, seguranca: 1 } },
      { id: "lead", label: "Lidero pessoas, produtos ou times", weights: { lideranca: 3, negocios: 1 } },
      { id: "own", label: "Tenho (ou quero ter) o meu negócio", weights: { negocios: 3 } },
    ],
  },
  {
    id: "format",
    text: "Que tipo de conversa você prefere?",
    answers: [
      { id: "demo", label: "Demo ao vivo, mão no código", weights: { ia: 1, mobile: 2 } },
      { id: "deep", label: "Mergulho técnico de arquitetura", weights: { arquitetura: 3, dados: 1 } },
      { id: "story", label: "História real, com erros e acertos", weights: { carreira: 2, lideranca: 1 } },
      { id: "trend", label: "Panorama do que está mudando", weights: { ia: 2, negocios: 1 } },
      { id: "incident", label: "Caso real de ataque e defesa", weights: { seguranca: 3 } },
    ],
  },
  {
    id: "tool",
    text: "Qual tema você mais gostaria de dominar?",
    answers: [
      { id: "agents", label: "Agentes, LLMs e como avaliar modelos", weights: { ia: 3 } },
      { id: "cross", label: "Flutter, Kotlin ou apps com IA no celular", weights: { mobile: 3, ia: 1 } },
      { id: "data", label: "PostgreSQL, dados, BI e pipelines", weights: { dados: 3 } },
      { id: "cloud", label: "Go, arquitetura e nuvem", weights: { arquitetura: 3 } },
      { id: "shield", label: "Segurança, criptografia e proteção de dados", weights: { seguranca: 3 } },
    ],
  },
  {
    id: "goal",
    text: "O que você quer levar do DevFest?",
    answers: [
      { id: "skill", label: "Uma habilidade nova pra usar na segunda", weights: { arquitetura: 1, dados: 1, mobile: 1, ia: 1 } },
      { id: "network", label: "Contatos, mentoria e histórias de quem já passou por isso", weights: { carreira: 3 } },
      { id: "future", label: "Ideias sobre o futuro da tecnologia", weights: { ia: 3 } },
      { id: "ship", label: "Como entregar melhor com o meu time", weights: { lideranca: 3 } },
      { id: "protect", label: "Saber proteger o que eu construo", weights: { seguranca: 3 } },
    ],
  },
];

/** Textos fixos da página (os dois com {track} usam t(); os demais são traduzidos por igualdade de texto, tt). */
const QUIZ_COPY = {
  title: "Monte sua trilha",
  subtitle: "Cinco perguntas rápidas e a gente sugere a trilha do DevFest que mais combina com você.",
  startButton: "Começar",
  next: "Próxima",
  seeResult: "Ver minha trilha",
  restart: "Refazer o quiz",
  resultLabel: "Sua trilha é",
  alsoFits: "Também combina com",
  suggestedTalks: "Palestras pra você",
  suggestedHint: "Uma por horário, sem choque na agenda.",
  addToAgenda: "Adicionar à minha agenda",
  addedToAgenda: "Adicionadas à sua agenda",
  agendaLink: "Ver minha agenda",
  talksSoon: "As palestras dessa trilha serão reveladas em breve.",
  share: "Copiar link do resultado",
  shared: "Link copiado",
  whatsapp: "Compartilhar no WhatsApp",
  shareMessage: track => t("quiz.shareMessage", "Fiz o quiz do DevFest Campinas 2026 e minha trilha é {track}!", { track }),
  sharedBanner: track => t("quiz.sharedBanner", "Alguém te mostrou a trilha {track}. Descubra a sua:", { track }),
};

/** Peso do assunto de uma palestra pela posição dele na lista (data/talk-topics.js): o 1º é o principal e vale cheio, os demais valem metade. */
const QUIZ_SCORING = { topicPositionWeights: [1, 0.5] };

const quizRepository = createRepository({ questions: QUIZ_QUESTIONS, copy: QUIZ_COPY, scoring: QUIZ_SCORING });
