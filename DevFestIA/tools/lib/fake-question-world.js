/**
 * Repositories de mentira das perguntas ao vivo (perguntas, votos e quadro da palestra), com o mesmo contrato dos reais
 * (firestore-repository.js e firestore-document-repository.js), em memória. Contam leituras e gravações e deixam
 * simular recusa do banco, pra os testes de tela conferirem o que a pessoa vê e o que foi gravado sem Firebase.
 */
const denied = () => Object.assign(new Error("permission-denied"), { code: "permission-denied" });
const matches = (doc, filters) => Object.entries(filters).every(([field, value]) => (Array.isArray(value) ? value.includes(doc[field]) : doc[field] === value));

function createFakeQuestions() {
  const docs = [];
  const listeners = new Set();
  let clock = 1;
  const notify = () => listeners.forEach(listener => listener());
  const world = {
    docs,
    reads: [],           // filtros de cada getWhere (leitura pontual)
    listenCount: () => listeners.size,
    failAddWith: null,   // erro pra devolver na próxima gravação
    seed(doc) { docs.push({ createdAtMs: clock++, status: "pending", ...doc }); notify(); },
    async getWhere(filters = {}) { world.reads.push(filters); return docs.filter(doc => matches(doc, filters)).map(doc => ({ ...doc })); },
    async add(uid, entryKey, data) {
      if (world.failAddWith) { const error = world.failAddWith; world.failAddWith = null; throw error; }
      docs.push({ id: `${uid}_${entryKey}`, entryKey, ...data, createdAtMs: clock++ });
      notify();
    },
    async update(id, fields) { Object.assign(docs.find(doc => doc.id === id), fields); notify(); },
    listen(filters, onNext) {
      const send = () => onNext(docs.filter(doc => matches(doc, filters)).map(doc => ({ ...doc })));
      listeners.add(send);
      send();
      return () => listeners.delete(send);
    },
  };
  return world;
}

function createFakeVotes() {
  const ids = new Set();
  const world = {
    ids,
    counts: {},          // votos por pergunta, pra countWhere
    countCalls: 0,
    failAddWith: null,   // erro fixo pra toda gravação enquanto estiver preenchido
    async add(uid, questionId, data) {
      if (world.failAddWith) throw world.failAddWith;
      const id = `${uid}_${questionId}`;
      if (ids.has(id)) throw denied();
      ids.add(id);
      world.counts[questionId] = (world.counts[questionId] ?? 0) + 1;
      return id;
    },
    async has(uid, questionId) { return ids.has(`${uid}_${questionId}`); },
    async countWhere({ entryKey }) { world.countCalls++; return world.counts[entryKey] ?? 0; },
  };
  return world;
}

/** Quadro público (um documento por palestra): `set` grava e avisa quem escuta; `emit` simula outra pessoa gravando. */
function createFakeBoards() {
  const store = new Map();
  const listeners = new Map();
  const notify = key => (listeners.get(key) ?? new Set()).forEach(listener => listener(store.get(key) ?? null));
  const world = {
    sets: [],            // { key, data } de cada gravação
    listenCount: key => (listeners.get(key)?.size ?? 0),
    failSetWith: null,
    async get(key) { return store.get(key) ?? null; },
    async set(key, data) {
      if (world.failSetWith) throw world.failSetWith;
      world.sets.push({ key, data });
      store.set(key, { id: key, ...data });
      notify(key);
    },
    emit(key, data) { store.set(key, { id: key, ...data }); notify(key); },
    listen(key, onNext) {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(onNext);
      onNext(store.get(key) ?? null);
      return () => listeners.get(key).delete(onNext);
    },
  };
  return world;
}

module.exports = { createFakeQuestions, createFakeVotes, createFakeBoards, denied };
