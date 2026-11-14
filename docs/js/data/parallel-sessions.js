/**
 * Sessões em PARALELO às palestras (hoje, o Coding Jam): rodam em outra sala, ao mesmo tempo que as trilhas, e não ocupam trilha nem entram em SCHEDULE
 * (a grade, o "agora" e o telão seguem as palestras). A grade mostra cada rodada como um card ALTO ao lado das trilhas, cobrindo as palestras do horário dela
 * (components/parallel-session-card.js, features/parallel-sessions.js). Só em DEV até `public: true`.
 *
 *   id        único (a página dos créditos pede por ele: `sessionId` em data/gcp-credits.js)  |  name = nome na tela  |  kicker = a etiqueta do card ("Lab de IA")  |  place = onde acontece
 *   rounds    rodadas { start, end } em HH:MM (MOCK até o horário real; mais de uma rodada = mais um card na grade; as rodadas de uma sessão não se sobrepõem)
 *   host      quem faz a sessão: `sponsor` = nome da marca em data/sponsors.js (logo e link vêm de lá, uma vez só) e `instagram` (o Linktree é o `link` da marca)
 *   highlightId  o destaque de sessão que ela é (data/talk-highlights.js: o "Mão na massa" do Coding Jam vira a faixa no topo do card)
 *   href      página da sessão (o card e o menu levam para lá)  |  color = cor do card (token CSS; a da trilha de IA/Vibe Coding, onde o lab acontece)
 * `texts`: frases do card.
 */
const PARALLEL_SESSIONS = [
  {
    id: "codejam",
    public: false,
    name: "Coding Jam",
    kicker: "Lab de IA",
    place: "Laboratório com computadores",
    rounds: [{ start: "10:00", end: "12:00" }],
    host: { sponsor: "Liga de TI PUC", instagram: "https://www.instagram.com/ligadetipucc" },
    href: "creditos.html",
    highlightId: "codejam",
    color: "var(--ia)",
  },
];

const PARALLEL_SESSIONS_TEXTS = {
  tag: "Em paralelo às palestras",
  hostLabel: "Quem faz o lab",
  details: "Créditos do Google Cloud e detalhes",
};

const parallelSessionsRepository = createRepository(PARALLEL_SESSIONS, {
  getById: id => PARALLEL_SESSIONS.find(session => session.id === id),
  /** As sessões que a pessoa pode ver: as públicas e, no modo DEV (`devMode`), todas. */
  visible: ({ devMode = false } = {}) => PARALLEL_SESSIONS.filter(session => session.public || devMode),
  texts: () => PARALLEL_SESSIONS_TEXTS,
});
