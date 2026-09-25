/**
 * Cliente mínimo (só `node:` built-ins, fetch nativo) do emulador do Firestore, pra testar as regras de
 * DevFestIA/firebase/firestore.rules sem tocar no banco real. Cada chamada leva o "quem" (`as`: identidade, "owner" = admin sem regras, `null` = sem login): o emulador
 * aceita token JWT sem assinatura, então dá pra simular uma pessoa anônima, uma conta Google verificada ou
 * outra qualquer só descrevendo os campos do token. Nada aqui conhece as coleções do site.
 *
 * Uso: firebase emulators:exec --only firestore --project demo-devfest --config DevFestIA/firebase/firebase.json "<comando>"
 * (o exec já define FIRESTORE_EMULATOR_HOST). Respostas: { ok, status, code, body } (nunca lançam por causa de regra).
 */
const PROJECT = "demo-devfest";

const base64url = value => Buffer.from(JSON.stringify(value)).toString("base64url");

/** Token que o emulador aceita: identidade anônima ou Google (com e-mail), como o Firebase Auth emitiria. */
function tokenFor({ uid, provider = "anonymous", email, emailVerified = true }) {
  const payload = { sub: uid, user_id: uid, firebase: { sign_in_provider: provider }, ...(email ? { email, email_verified: emailVerified } : {}) };
  return `${base64url({ alg: "none", typ: "JWT" })}.${base64url(payload)}.`;
}

const anonymous = uid => ({ uid, provider: "anonymous" });
const google = (uid, email, emailVerified = true) => ({ uid, provider: "google.com", email, emailVerified });

function toValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  throw new Error(`valor não suportado: ${value}`);
}
const toFields = data => Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)]));

function endpoint(path) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host) throw new Error("FIRESTORE_EMULATOR_HOST não definido: rode dentro de `firebase emulators:exec`");
  return `http://${host}/v1/projects/${PROJECT}/databases/(default)/documents${path}`;
}

async function call(as, url, body) {
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", ...(as === null ? {} : { authorization: `Bearer ${as === "owner" ? "owner" : tokenFor(as)}` }) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const parsed = await response.json().catch(() => ({}));
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return { ok: response.ok, status: response.status, code: first?.error?.status ?? null, body: parsed };
}

const documentName = (collection, id) => `projects/${PROJECT}/databases/(default)/documents/${collection}/${id}`;

/**
 * Grava o documento como o site faz (setDoc): campos do `data` + `createdAt` com o horário do servidor (REQUEST_TIME).
 * Sem pré-condição: se o documento já existir, as regras enxergam um update (e recusam), igual ao SDK.
 */
function createDoc(as, collection, id, data) {
  return call(as, endpoint(":commit"), {
    writes: [{
      update: { name: documentName(collection, id), fields: toFields(data) },
      updateTransforms: [{ fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" }],
    }],
  });
}

/** Altera só os campos de `data` num documento que já existe. */
function updateDoc(as, collection, id, data) {
  return call(as, endpoint(":commit"), {
    writes: [{
      update: { name: documentName(collection, id), fields: toFields(data) },
      updateMask: { fieldPaths: Object.keys(data) },
      currentDocument: { exists: true },
    }],
  });
}

const getDoc = (as, collection, id) => call(as, endpoint(`/${collection}/${id}`));

/** Consulta por igualdade ({campo: valor}); valor em array vira "in", como getWhere() do site. Devolve os ids em `ids`. */
async function query(as, collection, filters) {
  const where = Object.entries(filters);
  const structuredQuery = {
    from: [{ collectionId: collection }],
    where: { compositeFilter: { op: "AND", filters: where.map(([field, value]) => ({ fieldFilter: { field: { fieldPath: field }, ...(Array.isArray(value) ? { op: "IN", value: { arrayValue: { values: value.map(toValue) } } } : { op: "EQUAL", value: toValue(value) }) } })) } },
  };
  const result = await call(as, endpoint(":runQuery"), { structuredQuery });
  const ids = Array.isArray(result.body) ? result.body.filter(row => row.document).map(row => row.document.name.split("/").pop()) : [];
  return { ...result, ids };
}

/** Grava direto, sem passar pelas regras (dado de partida do teste). */
function seed(collection, id, data) {
  return createDoc("owner", collection, id, data);
}

module.exports = { anonymous, google, createDoc, updateDoc, getDoc, query, seed };
