/**
 * Sessões em PARALELO às palestras (hoje, o Coding Jam): rodam em outra sala, ao mesmo tempo que as trilhas, e não ocupam trilha nem entram em SCHEDULE
 * (a grade, o "agora" e o telão seguem as palestras). A grade mostra cada rodada como uma faixa "Em paralelo" (components/parallel-band.js) antes da primeira
 * palestra que começa a partir do horário dela (features/parallel-sessions.js). Só em DEV até `public: true`.
 *
 *   id        único (a página dos créditos pede por ele: `sessionId` em data/gcp-credits.js)  |  name = nome na tela  |  place = onde acontece
 *   rounds    rodadas { start, end } em HH:MM (MOCK até o horário real; mais de uma rodada = mais uma faixa na grade)
 *   href      página da sessão (a faixa e o menu levam para lá)  |  color = cor da faixa (token CSS)
 *   texts     frases da faixa
 */
const PARALLEL_SESSIONS = [
  {
    id: "codejam",
    public: false,
    name: "Coding Jam",
    place: "Laboratório com computadores",
    rounds: [{ start: "10:00", end: "12:00" }],
    href: "creditos.html",
    color: "var(--google-yellow)",
  },
];

const PARALLEL_SESSIONS_TEXTS = {
  tag: "Em paralelo às palestras",
  details: "Ver detalhes e créditos do Google Cloud",
};

const parallelSessionsRepository = createRepository(PARALLEL_SESSIONS, {
  getById: id => PARALLEL_SESSIONS.find(session => session.id === id),
  /** As sessões que a pessoa pode ver: as públicas e, no modo DEV (`devMode`), todas. */
  visible: ({ devMode = false } = {}) => PARALLEL_SESSIONS.filter(session => session.public || devMode),
  texts: () => PARALLEL_SESSIONS_TEXTS,
});
