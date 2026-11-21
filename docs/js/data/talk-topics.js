/**
 * Assuntos de cada palestra (quiz "Monte sua trilha"). Só dado, sem DOM.
 * A chave é o id do PRIMEIRO palestrante da palestra (data/schedule.js);
 * cada palestra leva 1 a 3 assuntos de `TALK_TOPICS`. O quiz soma os pontos
 * dos assuntos que a pessoa escolheu e monta a agenda dela com as palestras
 * que mais pontuam (features/quiz-scoring.js). Palestra nova: uma linha aqui.
 */
const TALK_TOPICS = ["ia", "dados", "arquitetura", "mobile", "seguranca", "carreira", "lideranca", "negocios"];

const TALK_TOPICS_BY_SPEAKER = {
  // IA/Vibe Coding
  "ana-andrade-gonsalves": ["mobile", "negocios"],
  "victor-ulisses-pugliese": ["ia"],
  "paulo-candido": ["carreira", "ia"],
  "guilherme-henrique-da-silva": ["ia", "arquitetura"],
  "sara-bandeira-coutinho": ["ia", "dados"],
  "alexandre-cabral": ["ia", "arquitetura"],
  "marcelo-pinheiro": ["ia", "dados"],
  "helson-carlos-dos-santos": ["ia", "arquitetura"],
  // Front-end / Back-end / Data - Full Stack
  "alvaro-camillo-neto": ["ia", "arquitetura"],
  "igor-lamino-aragao": ["dados", "arquitetura"],
  "felipe-gustavo-silva-teodoro": ["dados", "ia"],
  "emerson-dos-santos-queiroz": ["dados", "arquitetura"],
  "julia-cansado": ["ia", "dados"],
  "beatriz-moraes-souza-rodrigues": ["dados"],
  "marco-ollivier": ["arquitetura"],
  "bruno-eleodoro-roza": ["negocios", "seguranca"],
  "thais-santos-souza": ["arquitetura", "carreira"],
  // Mobile / Gerência de Projetos
  "leandro-garcia": ["ia", "negocios"],
  "lucas-mateus-mazei-sobrinho": ["lideranca", "ia"],
  "guilherme-de-oliveira-macedo": ["ia", "seguranca"],
  "irina-bezzan-miquelin": ["carreira", "ia"],
  "isaque-dias-coelho": ["mobile", "ia"],
  "angelica-oliveira": ["mobile", "ia"],
  "fabio-baldin": ["lideranca", "ia"],
  "toshi-ossada": ["mobile", "ia"],
  "michael-douglas-barbosa-araujo": ["ia"],
  "olivar-tamele": ["mobile", "ia"],
  "robot-framework-a-confirmar": ["arquitetura"],
  // Carreira em Tecnologia
  "gabriel-rodrigues-de-souza": ["carreira", "lideranca"],
  "valerio-matias": ["carreira"],
  "jesse-freitas": ["ia", "lideranca"],
  "alexandra-regina-cavalleiros": ["carreira", "ia"],
  "nakyta-nara-lucca": ["carreira", "negocios"],
  "amanda-araujo-duaibs": ["carreira", "lideranca"],
  "bianca-bordon-weiller": ["negocios"],
  "ana-paula-rodrigues": ["carreira", "ia"],
  // Cyber Segurança (Security) / Cloud
  "diego-marcos-moreira": ["seguranca"],
  "fernando-sedrez": ["ia", "arquitetura"],
  "gustavo-caetano": ["arquitetura"],
  "vinicius-tavares": ["carreira", "seguranca"],
  "davi-borges-pena": ["seguranca"],
  "vinicius-rodrigues-da-cunha-perallis": ["seguranca"],
  "joao-otavio-de-goes": ["seguranca"],
  "larissa-azevedo": ["seguranca", "arquitetura"],
  "vinicius-pivetta": ["dados", "ia"],
};

const talkTopicsRepository = createRepository(TALK_TOPICS_BY_SPEAKER, {
  topicIds: () => TALK_TOPICS,
  /** Assuntos de uma palestra do schedule (`talk.speakers[0].id`); sem palestrante ou sem cadastro = nenhum. */
  forTalk: talk => TALK_TOPICS_BY_SPEAKER[talk?.speakers?.[0]?.id] ?? [],
});
