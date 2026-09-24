/**
 * Confere as traduções do site (roda no CI):  node DevFestIA/tools/i18n/check-i18n.js
 *   1. Toda chamada t("chave", "texto PT") / tn(...) e todo data-i18n="chave" do código tem a chave em
 *      TODO dicionário de idioma (data/i18n/<id>.js), e o dicionário não tem chave sobrando.
 *   2. Os {marcadores} do texto em português e da tradução são os mesmos.
 *   3. Chamada de t()/tn() com chave que não é texto literal é erro (não dá pra conferir).
 *   4. Dados traduzidos por igualdade de texto (tt, `texts` do dicionário): toda string de exibição dos
 *      dados listados em LOCALIZED_DATASETS (app.js), do menu e de TICKETS_NOTE/TICKET_PRICE_TBD tem
 *      tradução, e a tradução não é de texto que não existe mais nos dados.
 * `KEEP_AS_IS` são textos que valem em qualquer idioma (marcas, e-mail, números).
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const docs = path.join(__dirname, "..", "..", "..", "docs");
const read = file => fs.readFileSync(path.join(docs, file), "utf8");
const errors = [];
const fail = message => errors.push(message);

const KEEP_AS_IS = new Set(["Meetup", "Instagram", "LinkedIn", "Linktree", "VIP", "GDG Campinas", "DevFest Campinas", "EloTech 2026", "gdgcampinascontato@gmail.com", "Campinas, SP", "Sympla", "Links", "Networking", "Workshop", "Front-end / Back-end / Data", "Front/Back/Data", "Mobile / Agile", "Mobile/Agile", "Google Sans"]);
// Campos dos dados que não são texto de tela (ids, endereços, cores, arquivos, textos já gerados por t()).
const SKIP_KEYS = new Set(["id", "url", "href", "color", "trackColor", "icon", "date", "start", "end", "timezone", "utcOffset", "image", "logo", "photo", "file", "youtubeId", "tier", "shape", "endpoint", "provider", "alt", "waitlistUrl", "price", "value", "min", "max"]);
const isTechnical = value => /^(https?:|mailto:|var\(|assets\/|js\/|#)/.test(value) || /^[\d\s+.,%/-]+$/.test(value);

// ---------- 1 e 2: chaves usadas no código ----------
function listFiles(dir, ext) {
  return fs.readdirSync(path.join(docs, dir), { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(relative, ext);
    return entry.name.endsWith(ext) ? [relative] : [];
  });
}

const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const STRING = String.raw`("(?:[^"\\]|\\.)*"|` + "`[^`$]*`)";
const T_CALL = new RegExp(String.raw`\bt\(\s*"([\w.-]+)"\s*,\s*` + STRING, "g");
const TN_CALL = new RegExp(String.raw`\btn\(\s*"([\w.-]+)"\s*,\s*[^,]+,\s*` + STRING + String.raw`\s*,\s*` + STRING, "g");
const ANY_CALL = /(?<![\w.$])(?:t|tn)\(\s*(?!["`])(?!\))/g;
const literal = raw => (raw.startsWith('"') ? JSON.parse(raw) : raw.slice(1, -1));

const used = new Map(); // chave -> texto PT
const addUse = (key, text, where) => {
  if (used.has(key) && used.get(key) !== text) fail(`${where}: a chave "${key}" tem dois textos em português diferentes ("${used.get(key)}" e "${text}")`);
  used.set(key, text);
};

const exclude = file => /^js[\\/](data[\\/]i18n|features[\\/]i18n)/.test(file);
listFiles("js", ".js").filter(file => !exclude(file)).forEach(file => {
  const source = stripComments(read(file));
  for (const match of source.matchAll(T_CALL)) addUse(match[1], literal(match[2]), file);
  for (const match of source.matchAll(TN_CALL)) {
    addUse(`${match[1]}.one`, literal(match[2]), file);
    addUse(`${match[1]}.other`, literal(match[3]), file);
  }
  for (const match of source.matchAll(ANY_CALL)) fail(`${file}: t()/tn() com chave que não é texto literal (${source.slice(match.index, match.index + 40).replace(/\n/g, " ")}...)`);
});

fs.readdirSync(docs).filter(name => name.endsWith(".html")).forEach(file => {
  const html = read(file);
  for (const match of html.matchAll(/<(\w+)[^>]*\sdata-i18n="([\w.-]+)"[^>]*>([^<]*)</g)) addUse(match[2], match[3].trim(), file);
});

// ---------- dicionários ----------
const context = vm.createContext({ console });
vm.runInContext(`${read("js/data/repository.js")}\n${read("js/data/i18n/languages.js")}`, context);
const languages = vm.runInContext("I18N_LANGUAGES", context);
const defaultLang = vm.runInContext("I18N_DEFAULT_LANGUAGE", context);
const placeholders = text => [...String(text).matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(",");

const dictionaries = {};
languages.filter(language => language.id !== defaultLang).forEach(language => {
  const file = `js/data/i18n/${language.id}.js`;
  if (!fs.existsSync(path.join(docs, file))) return fail(`falta o dicionário ${file}`);
  vm.runInContext(read(file), context);
  dictionaries[language.id] = vm.runInContext(`I18N_DICTIONARIES["${language.id}"]`, context);
});

// ---------- 4: dados traduzidos por texto ----------
const dataScripts = [...new Set(["index.html", "quiz.html", "ingressos.html"].flatMap(page => [...read(page).matchAll(/<script src="(js\/data\/[^"?]+)/g)].map(match => match[1])))]
  .filter(file => !/firebase|i18n|schedule\.dev|repository\.js$/.test(file) || /(^|\/)repository\.js$/.test(file) && false);
const dataContext = vm.createContext({ console, window: {}, t: (key, fallback) => fallback, tn: () => "", CURRENT_EDITION: "2026", createPersistedSetRepository: () => ({}), createPersistedValueRepository: () => ({}) });
vm.runInContext(read("js/data/repository.js"), dataContext);
["js/data/persisted-set-repository.js", "js/data/persisted-value-repository.js"].forEach(file => vm.runInContext(read(file), dataContext));
const loadOrder = ["js/data/mock-links.js", "js/data/mock-photo.js", "js/data/mock-speakers.js", "js/data/mock-talks.js", "js/data/schedule-builder.js", "js/data/schedule.js"];
[...loadOrder, ...dataScripts.filter(file => !loadOrder.includes(file) && !/persisted|repository\.js$/.test(file))].forEach(file => {
  try {
    vm.runInContext(read(file), dataContext, { filename: file });
  } catch (error) {
    fail(`não consegui carregar ${file} pra conferir as traduções (${error.message})`);
  }
});
vm.runInContext(read("js/components/site-nav.js"), dataContext);

const appSource = read("js/app.js");
const datasetThunks = appSource.match(/const LOCALIZED_DATASETS = \[([\s\S]*?)\n\];/)[1].split("\n").map(line => line.replace(/\s\/\/.*$/, "").trim().replace(/,$/, "")).filter(Boolean);
const datasetStrings = new Set();
const collect = (node, visited = new WeakSet()) => {
  if (typeof node === "string") return datasetStrings.add(node);
  if (node === null || typeof node !== "object" || visited.has(node)) return;
  if (!(Array.isArray(node) || Object.getPrototypeOf(node) === Object.prototype || node.constructor?.name === "Object")) return;
  visited.add(node);
  Object.entries(node).forEach(([key, value]) => { if (!SKIP_KEYS.has(key)) collect(value, visited); });
};
datasetThunks.forEach(thunk => {
  try {
    collect(vm.runInContext(`(${thunk})()`, dataContext));
  } catch (error) {
    fail(`LOCALIZED_DATASETS: não consegui ler ${thunk} (${error.message})`);
  }
});
["SITE_PAGES.map(page => page.label)", "[TICKETS_NOTE, TICKET_PRICE_TBD]"].forEach(expression => collect(vm.runInContext(expression, dataContext)));
const displayStrings = [...datasetStrings].filter(text => !KEEP_AS_IS.has(text) && !isTechnical(text));

// ---------- confere cada idioma ----------
Object.entries(dictionaries).forEach(([id, dictionary]) => {
  const strings = dictionary.strings ?? {};
  const texts = dictionary.texts ?? {};
  used.forEach((pt, key) => {
    if (!(key in strings)) return fail(`[${id}] falta a chave "${key}" (PT: ${JSON.stringify(pt)})`);
    if (placeholders(pt) !== placeholders(strings[key])) fail(`[${id}] "${key}": marcadores diferentes entre PT ({${placeholders(pt)}}) e a tradução ({${placeholders(strings[key])}})`);
  });
  Object.keys(strings).forEach(key => { if (!used.has(key)) fail(`[${id}] a chave "${key}" não é usada em lugar nenhum`); });
  displayStrings.forEach(text => { if (!(text in texts)) fail(`[${id}] falta traduzir o texto dos dados: ${JSON.stringify(text)}`); });
  Object.keys(texts).forEach(text => { if (!displayStrings.includes(text)) fail(`[${id}] a tradução de dados "${text}" não bate com nenhum texto de tela dos dados`); });
});

if (errors.length) {
  console.error(errors.map(message => `FAIL: ${message}`).join("\n"));
  process.exit(1);
}
console.log(`OK: ${used.size} chaves e ${displayStrings.length} textos de dados traduzidos em ${Object.keys(dictionaries).join(", ")}`);
