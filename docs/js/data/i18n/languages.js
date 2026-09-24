/**
 * Idiomas do site. `id` é o valor de ?lang=; `locale` alimenta datas e moeda;
 * `htmlLang` vai no <html lang>. Português é o padrão e o texto dele mora no
 * próprio código (cada t() leva o texto em PT como padrão): só os OUTROS idiomas
 * têm dicionário (data/i18n/<id>.js): `{ strings: { chave: texto }, texts: { "texto em PT": texto } }`
 * (`strings` pras chaves de t()/tn(), `texts` pros dados traduzidos por tt()). Idioma novo = uma
 * linha aqui + um dicionário. `I18N_DICTIONARIES` é o registro onde cada dicionário se cadastra.
 */
const I18N_LANGUAGES = [
  { id: "pt", label: "PT", name: "Português", locale: "pt-BR", htmlLang: "pt-BR" },
  { id: "en", label: "EN", name: "English", locale: "en-US", htmlLang: "en" },
];
const I18N_DEFAULT_LANGUAGE = "pt";
const I18N_DICTIONARIES = {};

const i18nLanguagesRepository = createRepository(I18N_LANGUAGES);
