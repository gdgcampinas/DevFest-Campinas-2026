/**
 * Lista de espera dos ingressos (quem quer ser avisado quando abrirem): só números e nomes, nada de lógica (a regra de validação está em features/waitlist-rules.js). `collection` e `entryKey` valem pra
 * plateia (data/waitlist-repository.js) e pro admin (data/waitlist-moderation-repository.js); `maxName` e `maxEmail` ESPELHAM as regras do Firestore (DevFestIA/firebase/firestore.rules: 80 = "size() < 81",
 * 120 = "size() < 121"). `sources` são as páginas que oferecem o cadastro (vai no documento, pra o admin saber de onde a pessoa veio).
 */
const WAITLIST_CONFIG = {
  collection: "waitlist",
  entryKey: "interest",
  minName: 2,
  maxName: 80,
  maxEmail: 120,
  sources: ["home", "ingressos"],
};

const waitlistConfigRepository = createRepository(WAITLIST_CONFIG);
