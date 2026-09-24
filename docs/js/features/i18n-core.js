/**
 * Núcleo da internacionalização, sem DOM nem globais: idiomas, dicionários,
 * armazenamento e a URL entram por parâmetro. Arquivo "dual" (navegador e Node)
 * pra DevFestIA/tools/i18n testar a regra sem navegador.
 *
 * Como funciona: português é o padrão e mora no código. Cada texto traduzível é
 * `t("chave", "Texto em português")`; se o idioma atual tem essa chave no
 * dicionário, devolve a tradução, senão o próprio português (nunca aparece
 * chave crua nem texto vazio). Plural: `tn("chave", n, "1 item", "{count} itens")`
 * usa as chaves "chave.one"/"chave.other". `{nome}` no texto é trocado pelos
 * `params`. O idioma vem de ?lang=, senão do que a pessoa escolheu antes
 * (storage), senão do padrão; ?lang= válido fica gravado.
 *
 * Dados (trilhas, ingressos, banners da grade, textos de "Sobre"...) ficam em
 * português no arquivo de dados e são traduzidos por igualdade de texto:
 * `tt("Grátis")` devolve a tradução cadastrada em `texts` (ou o próprio texto), e
 * `localizeStrings(dado, tt)` faz isso em todas as strings de um dado, no lugar,
 * uma vez ao carregar a página: quem consome o dado não precisa saber de idioma.
 */
const I18N_STORAGE_KEY = "devfest-campinas-2026:lang";

function interpolate(text, params) {
  return text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole));
}

/**
 * Troca, no lugar, cada string de `node` (arrays e objetos simples, em qualquer
 * profundidade) pela tradução `translate(texto)`. Datas, funções e objetos de
 * outra classe ficam como estão; objeto já visitado é pulado (referências repetidas).
 */
function localizeStrings(node, translate, visited = new WeakSet()) {
  if (node === null || typeof node !== "object" || visited.has(node)) return node;
  const plain = Array.isArray(node) || Object.getPrototypeOf(node) === Object.prototype;
  if (!plain) return node;
  visited.add(node);
  Object.keys(node).forEach(key => {
    const value = node[key];
    if (typeof value === "string") node[key] = translate(value);
    else localizeStrings(value, translate, visited);
  });
  return node;
}

function createI18n({ languages, dictionaries, defaultLang, storage = null, search = "" }) {
  const known = id => languages.some(language => language.id === id);
  const stored = () => { try { return storage?.getItem(I18N_STORAGE_KEY); } catch { return null; } };
  const fromUrl = new URLSearchParams(search).get("lang");
  const lang = known(fromUrl) ? fromUrl : known(stored()) ? stored() : defaultLang;
  if (known(fromUrl)) { try { storage?.setItem(I18N_STORAGE_KEY, lang); } catch { /* sem persistência: vale só nesta página */ } }

  const dictionary = dictionaries[lang]?.strings ?? {};
  const texts = dictionaries[lang]?.texts ?? {};
  const current = languages.find(language => language.id === lang);
  const t = (key, fallback, params) => {
    const text = dictionary[key] ?? fallback;
    return params ? interpolate(text, params) : text;
  };
  const tt = text => texts[text] ?? text;
  const tn = (key, count, one, other, params = {}) =>
    t(`${key}.${count === 1 ? "one" : "other"}`, count === 1 ? one : other, { count, ...params });

  return { lang, locale: current.locale, htmlLang: current.htmlLang, isDefault: lang === defaultLang, t, tn, tt };
}

if (typeof module !== "undefined") module.exports = { createI18n, interpolate, localizeStrings, I18N_STORAGE_KEY };
