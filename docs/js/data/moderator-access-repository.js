/**
 * Pergunta ao banco "esta conta é moderadora?", do lado do MODERADOR (app com o login Google dele): lê `raffle-state/current`, que as regras do Firestore só deixam ler a dono e moderador cadastrado
 * (qualquer outra conta recebe `permission-denied`). Não grava nada e não precisa de regra nova. Quem decide é o banco; a tela só usa a resposta (features/moderator-access.js). Mesmo padrão de
 * wall-moderation-repository.js.
 */
const moderatorAccessDocuments = window.createFirestoreDocumentRepository({
  db: window.moderatorClient.db,
  collectionName: "raffle-state",
  edition: CURRENT_EDITION,
});

window.moderatorAccessRepository = { probe: () => moderatorAccessDocuments.get("current") };
