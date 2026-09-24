/**
 * Testa o núcleo de internacionalização (docs/js/features/i18n-core.js), sem navegador.
 *   node --test DevFestIA/tools/i18n/i18n.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const path = require("node:path");
const { createI18n, interpolate, localizeStrings, I18N_STORAGE_KEY } = require(path.join(__dirname, "..", "..", "..", "docs/js/features/i18n-core.js"));

const languages = [
  { id: "pt", locale: "pt-BR", htmlLang: "pt-BR" },
  { id: "en", locale: "en-US", htmlLang: "en" },
];
const dictionaries = {
  en: { strings: { "a.b": "Hello {name}", "n.one": "{count} item", "n.other": "{count} items" }, texts: { "Grátis": "Free" } },
};
const memoryStorage = (initial = {}) => {
  const data = { ...initial };
  return { data, getItem: key => data[key] ?? null, setItem: (key, value) => { data[key] = value; } };
};
const make = (options = {}) => createI18n({ languages, dictionaries, defaultLang: "pt", ...options });

test("sem ?lang= nem escolha anterior fica no idioma padrão e devolve o texto em português", () => {
  const i18n = make({ storage: memoryStorage(), search: "" });
  assert.strictEqual(i18n.lang, "pt");
  assert.strictEqual(i18n.isDefault, true);
  assert.strictEqual(i18n.t("a.b", "Olá {name}", { name: "Ana" }), "Olá Ana");
  assert.strictEqual(i18n.tt("Grátis"), "Grátis");
});

test("?lang=en traduz, grava a escolha e manda o locale certo", () => {
  const storage = memoryStorage();
  const i18n = make({ storage, search: "?demo=1&lang=en" });
  assert.strictEqual(i18n.lang, "en");
  assert.strictEqual(i18n.locale, "en-US");
  assert.strictEqual(i18n.htmlLang, "en");
  assert.strictEqual(storage.data[I18N_STORAGE_KEY], "en");
  assert.strictEqual(i18n.t("a.b", "Olá {name}", { name: "Ana" }), "Hello Ana");
  assert.strictEqual(i18n.tt("Grátis"), "Free");
});

test("sem ?lang= usa o que a pessoa escolheu antes; ?lang=pt volta e grava", () => {
  const storage = memoryStorage({ [I18N_STORAGE_KEY]: "en" });
  assert.strictEqual(make({ storage, search: "" }).lang, "en");
  assert.strictEqual(make({ storage, search: "?lang=pt" }).lang, "pt");
  assert.strictEqual(storage.data[I18N_STORAGE_KEY], "pt");
});

test("idioma desconhecido (na URL ou guardado) cai no padrão", () => {
  assert.strictEqual(make({ storage: memoryStorage({ [I18N_STORAGE_KEY]: "xx" }), search: "?lang=fr" }).lang, "pt");
});

test("storage indisponível não quebra: o idioma vale só nesta página", () => {
  const broken = { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } };
  assert.strictEqual(make({ storage: broken, search: "?lang=en" }).lang, "en");
  assert.strictEqual(make({ storage: null, search: "" }).lang, "pt");
});

test("chave que falta no dicionário cai no português, nunca na chave", () => {
  const i18n = make({ storage: memoryStorage(), search: "?lang=en" });
  assert.strictEqual(i18n.t("nao.existe", "Texto PT"), "Texto PT");
  assert.strictEqual(i18n.tt("Sem tradução"), "Sem tradução");
});

test("tn escolhe singular ou plural e injeta {count}", () => {
  const en = make({ storage: memoryStorage(), search: "?lang=en" });
  assert.strictEqual(en.tn("n", 1, "{count} item PT", "{count} itens PT"), "1 item");
  assert.strictEqual(en.tn("n", 3, "{count} item PT", "{count} itens PT"), "3 items");
  const pt = make({ storage: memoryStorage(), search: "" });
  assert.strictEqual(pt.tn("n", 1, "{count} item PT", "{count} itens PT"), "1 item PT");
  assert.strictEqual(pt.tn("n", 0, "{count} item PT", "{count} itens PT"), "0 itens PT");
});

test("interpolate troca só os {marcadores} conhecidos", () => {
  assert.strictEqual(interpolate("{a} e {b} e {c}", { a: 1, b: "x" }), "1 e x e {c}");
});

test("localizeStrings traduz no lugar strings de objetos e arrays, sem tocar em datas, funções e ciclos", () => {
  const date = new Date(0);
  const shared = { name: "Grátis" };
  const data = { list: [shared, shared], title: "Grátis", when: date, fn: () => "Grátis", n: 3, nested: { deep: ["Grátis", "Outro"] } };
  data.self = data;
  localizeStrings(data, text => (text === "Grátis" ? "Free" : text));
  assert.strictEqual(data.title, "Free");
  assert.strictEqual(shared.name, "Free");
  assert.deepStrictEqual(data.nested.deep, ["Free", "Outro"]);
  assert.strictEqual(data.when, date);
  assert.strictEqual(data.fn(), "Grátis");
  assert.strictEqual(data.n, 3);
});
