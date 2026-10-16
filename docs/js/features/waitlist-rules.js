/**
 * Regras PURAS da lista de espera dos ingressos (sem tela, sem banco): validar o que a pessoa digitou e montar o que o admin exporta. Duas metades que usam a mesma regra de e-mail
 * (normalizeEmail, de data/email-hash.js): a plateia (validateWaitlistEntry) e o admin (dedupeWaitlist, waitlistCsv, waitlistEmails). Tudo por parâmetro (`config` = data/waitlist-config.js).
 */
const WAITLIST_EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Nome e e-mail prontos pra gravar (nome sem espaço sobrando, e-mail em minúsculas). Erro tem `field` ("name" ou "email") pra tela marcar o campo certo. */
function validateWaitlistEntry({ name, email, source = "", lang = "" }, config) {
  const cleanName = String(name ?? "").replace(/\s+/g, " ").trim();
  if (cleanName.length < config.minName || cleanName.length > config.maxName) throw Object.assign(new Error("nome inválido"), { field: "name" });
  const cleanEmail = normalizeEmail(email);
  if (!WAITLIST_EMAIL_PATTERN.test(cleanEmail) || cleanEmail.length > config.maxEmail) throw Object.assign(new Error("e-mail inválido"), { field: "email" });
  return {
    name: cleanName,
    email: cleanEmail,
    ...(config.sources.includes(source) ? { source } : {}),
    ...(lang ? { lang: String(lang).slice(0, 5) } : {}),
  };
}

/** Do mais novo pro mais antigo. */
const sortWaitlist = entries => [...entries].sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));

/** Uma linha por e-mail (a mesma pessoa pode ter se cadastrado em dois aparelhos): fica o cadastro mais antigo. */
function dedupeWaitlist(entries) {
  const byEmail = new Map();
  [...entries].sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0)).forEach(entry => {
    const key = normalizeEmail(entry.email);
    if (!byEmail.has(key)) byEmail.set(key, entry);
  });
  return sortWaitlist([...byEmail.values()]);
}

/** Célula de CSV: aspas dobradas, e um apóstrofo na frente de texto que a planilha leria como fórmula (=, +, -, @), pra ninguém executar nada ao abrir o arquivo. */
function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV sem repetidos, com BOM (o Excel abre os acentos certos). `formatDate(ms)` vem de fora (fuso e formato são da tela). */
function waitlistCsv(entries, { formatDate = ms => new Date(ms).toISOString(), headers = ["nome", "email", "origem", "idioma", "data"] } = {}) {
  const rows = dedupeWaitlist(entries).map(entry => [entry.name, entry.email, entry.source ?? "", entry.lang ?? "", entry.createdAtMs ? formatDate(entry.createdAtMs) : ""]);
  return `﻿${[headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/** Todos os e-mails, sem repetir, separados por vírgula (pra colar no campo "Cco" de um e-mail). */
const waitlistEmails = entries => dedupeWaitlist(entries).map(entry => entry.email).join(", ");

if (typeof module !== "undefined") module.exports = { validateWaitlistEntry, sortWaitlist, dedupeWaitlist, waitlistCsv, waitlistEmails };
