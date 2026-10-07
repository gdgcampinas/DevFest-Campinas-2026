/**
 * Destaques de sessão: uma palestra da grade que pede um card diferente (hoje, o Coding Jam). A palestra continua
 * sendo uma palestra normal (trilha, slot, favorito, calendário, check-in, avaliação) e só ganha `highlight: "<id>"`
 * no dado (ex.: mock-talks.js); tudo o que muda no card e no modal vem DAQUI, por dado, sem CSS ou JS por id.
 *
 *   id        valor de `highlight` na palestra
 *   label     chip do card ("Coding Jam"); icon = nome de data/icons.js (também a marca d'água); color = cor do destaque (token CSS)
 *   ribbon    faixa no topo do card ("Mão na massa", opcional)
 *   tagline   frase do card e do modal  |  note = aviso curto do card, com `noteIcon` (opcionais)
 *   tools     ferramentas recomendadas pra sessão: { label: "Recomendamos usar", items: ["Antigravity", ...] } (opcional; card e modal)
 *   host      quem conduz a sessão quando ela não tem palestrante (nome e foto opcional)
 *   questions false desliga as perguntas ao vivo dessa sessão (modal, quadro da sala e moderação)
 *   contest   true liga o concurso da sessão: cada pessoa com check-in cadastra o projeto, a turma vota (um voto por check-in) e o
 *             moderador publica o pódio (features/talk-contest.js, contest-moderation.js; regras contest-* do Firestore)
 *   podium    1º, 2º e 3º lugar; `prize` (opcional) aparece no card e no modal quando preenchido
 *   steps     etapas da sessão  |  rules = regras curtas
 * `slots` (quantos slots da mesma trilha a sessão ocupa) fica pra quando o jam passar de 1 slot: a grade e o cálculo do fim
 * mudam, o card não.
 */
const TALK_HIGHLIGHTS = [
  {
    id: "codejam",
    label: "Coding Jam",
    icon: "trophy",
    color: "var(--google-yellow)",
    ribbon: "Mão na massa",
    tagline: "Monte seu projeto, apresente e dispute o pódio",
    note: "Traga seu notebook",
    noteIcon: "laptop",
    tools: { label: "Recomendamos usar", items: ["Antigravity", "Antigravity IDE", "Gemini"] },
    host: { name: "GDG Campinas", photo: "assets/brand/gdg-icon.svg" },
    questions: false,
    contest: true,
    podium: [
      { place: "1º lugar", prize: "" },
      { place: "2º lugar", prize: "" },
      { place: "3º lugar", prize: "" },
    ],
    steps: [
      { label: "Intro e setup", text: "Conheça a turma e deixe o ambiente pronto antes de começar." },
      { label: "Construção", text: "Mão na massa: você decide o que construir e entrega algo que funcione, mesmo que simples." },
      { label: "Apresentação", text: "Mostre o seu projeto para a sala e envie antes de sair." },
      { label: "Votação e pódio", text: "Quem fez check-in vota, e os três projetos mais votados sobem ao pódio." },
    ],
    rules: [
      "Traga seu notebook.",
      "Faça check-in na sala para poder votar.",
      "Cada check-in vale um voto.",
    ],
  },
];

const talkHighlightsRepository = createRepository(TALK_HIGHLIGHTS, {
  getById: id => TALK_HIGHLIGHTS.find(highlight => highlight.id === id),
  /** O destaque de uma palestra (ou undefined): `data` é a palestra do SCHEDULE. */
  forTalk: data => talkHighlightsRepository.getById(data?.highlight),
  /** Perguntas ao vivo valem, a menos que o destaque da palestra as desligue. */
  allowsQuestions: data => talkHighlightsRepository.forTalk(data)?.questions !== false,
  /** A sessão tem concurso (projetos, votos e pódio)? */
  hasContest: data => Boolean(talkHighlightsRepository.forTalk(data)?.contest),
});
