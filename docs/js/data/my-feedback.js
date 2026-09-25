/**
 * O que ESTE navegador já fez de feedback: check-ins e avaliações (chaves de
 * palestra, e "event-end" pro evento). O uid anônimo do Firebase também é por
 * navegador, então isto equivale ao que existe no Firestore pra esta pessoa,
 * sem gastar leituras (limite do plano grátis) pra montar "Minhas palestras".
 * Trocar o storage é editar só estas linhas.
 */
const myCheckinsRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-checkins" });
const myRatingsRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-ratings" });
/** Palestras em que ESTE navegador já mandou pergunta: só quem perguntou relê as próprias (quem só olha não gasta essa leitura). */
const myAskedRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-asked" });
/** Ids das perguntas em que ESTE navegador já votou: "Votado" na tela sem baixar os votos (que o celular nem pode ler). */
const myVotesRepository = createPersistedSetRepository({ storageKey: "devfest-campinas-2026:my-votes" });

/** Nome digitado no último feedback, pra pré-preencher o das próximas palestras (o nome é obrigatório). */
const myNameRepository = createPersistedValueRepository({ storageKey: "devfest-campinas-2026:my-name" });
