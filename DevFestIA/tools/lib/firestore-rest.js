/**
 * Repository do Firestore via REST (sem SDK, sem npm), pro lado servidor.
 * Quem consome usa getDocument/listDocuments/commit e nunca vê o formato
 * "typed values" da API: encode/decode ficam aqui dentro. Autenticação
 * injetada (`auth.getAccessToken`), então nada aqui sabe de conta de serviço.
 */
const MAX_WRITES_PER_COMMIT = 400;

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(value) } };
}

function encodeFields(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, encodeValue(value)]));
}

function decodeValue(value) {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values ?? []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields ?? {});
  return null;
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function createFirestoreRestRepository({ projectId, auth, fetchFn = fetch }) {
  const root = `projects/${projectId}/databases/(default)/documents`;
  const url = path => `https://firestore.googleapis.com/v1/${path}`;

  async function request(path, options = {}) {
    const response = await fetchFn(url(path), {
      ...options,
      headers: { authorization: `Bearer ${await auth.getAccessToken()}`, "content-type": "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Firestore ${response.status} ${path}: ${await response.text()}`);
    return response.json();
  }

  return {
    /** Documento como objeto simples, ou null se não existir. */
    async getDocument(collection, id) {
      const doc = await request(`${root}/${collection}/${id}`);
      return doc ? decodeFields(doc.fields ?? {}) : null;
    },

    /** Todos os documentos de uma coleção ({ id, ...campos }), paginando. */
    async listDocuments(collection) {
      const items = [];
      let pageToken = "";
      do {
        const page = await request(`${root}/${collection}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ""}`);
        (page?.documents ?? []).forEach(doc => items.push({ id: doc.name.split("/").pop(), ...decodeFields(doc.fields ?? {}) }));
        pageToken = page?.nextPageToken ?? "";
      } while (pageToken);
      return items;
    },

    /** Grava (substitui) e apaga em lotes: writes = [{ set: [collection, id, data] } | { remove: [collection, id] }]. */
    async commit(writes, { stampField = "updatedAt" } = {}) {
      for (let start = 0; start < writes.length; start += MAX_WRITES_PER_COMMIT) {
        const batch = writes.slice(start, start + MAX_WRITES_PER_COMMIT).map(write => {
          if (write.remove) return { delete: `${root}/${write.remove[0]}/${write.remove[1]}` };
          const [collection, id, data] = write.set;
          return {
            update: { name: `${root}/${collection}/${id}`, fields: encodeFields(data) },
            updateTransforms: [{ fieldPath: stampField, setToServerValue: "REQUEST_TIME" }],
          };
        });
        await request(`projects/${projectId}/databases/(default)/documents:commit`, { method: "POST", body: JSON.stringify({ writes: batch }) });
      }
    },
  };
}

module.exports = { createFirestoreRestRepository, encodeFields, decodeFields };
