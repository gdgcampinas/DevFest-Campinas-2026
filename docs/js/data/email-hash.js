/**
 * Chave pública de um inscrito: SHA-256 do e-mail normalizado, prefixado
 * pela edição. É a ÚNICA fonte dessa regra — o site (consulta "esse
 * e-mail está inscrito?") e o job de sincronização com o Sympla
 * (DevFestIA/tools/sympla-sync, Node) usam este mesmo arquivo, pra que
 * quem escreve e quem lê nunca divirjam. Por isso o arquivo é "dual":
 * script clássico no navegador (funções globais) e módulo CommonJS no
 * Node. `crypto.subtle` existe nos dois (globalThis.crypto no Node 20+).
 */
function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Id do documento em `registrations`: "<edição>_<sha256 do e-mail normalizado>". */
async function registrationKey(edition, email) {
  return `${edition}_${await sha256Hex(normalizeEmail(email))}`;
}

if (typeof module !== "undefined") module.exports = { normalizeEmail, sha256Hex, registrationKey };
