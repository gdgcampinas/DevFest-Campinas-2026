/**
 * Caso de uso: conta (e, se o plano mandar, apaga) os documentos da edição
 * atual nas coleções de teste. Depende só de `database` (listDocuments +
 * commit, ver ../lib/firestore-rest.js), injetado, e da lista de coleções
 * (padrão: a lista fixa). Documentos de outra edição nunca são tocados.
 */
const { PURGEABLE_COLLECTIONS } = require("./purge-plan.js");

async function runPurge({ database, edition, deleting, collections = PURGEABLE_COLLECTIONS }) {
  const report = {};
  for (const collection of collections) {
    const docs = (await database.listDocuments(collection)).filter(doc => doc.edition === edition);
    if (deleting && docs.length) await database.commit(docs.map(doc => ({ remove: [collection, doc.id] })));
    report[collection] = { found: docs.length, deleted: deleting ? docs.length : 0 };
  }
  return report;
}

module.exports = { runPurge };
