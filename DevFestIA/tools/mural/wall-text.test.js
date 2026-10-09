/**
 * Regras puras do texto do mural de recados (docs/js/features/wall-text.js): limpeza, palavra ofensiva (inclusive com acento, maiúscula e troca de letras por número), dado pessoal, o documento a
 * gravar e o espaço livre do aparelho.
 *   node --test DevFestIA/tools/mural/wall-text.test.js
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");
const { cleanWallText, findBlockedWord, validateWallPost, nextWallSlot, wallEntry } = load("features/wall-text.js");

const config = { maxLength: 40, maxNickname: 8, prompts: [{ id: "buscar" }, { id: "recado" }], blocklist: ["merda", "idiota", "puta", "viado"] };
const post = (extra = {}) => ({ text: "Vim pra aprender", nickname: "", prompt: "buscar", ...extra });

test("limpeza: espaços repetidos e das pontas saem e o texto é cortado no tamanho", () => {
  assert.equal(cleanWallText("  oi   tudo \n bem  "), "oi tudo bem");
  assert.equal(cleanWallText("abcdefghij", 4), "abcd");
  assert.equal(cleanWallText(null), "");
});

test("palavra ofensiva: pega com acento, maiúscula, troca por número e plural, sem pegar pedaço no meio de outra palavra", () => {
  const find = text => findBlockedWord(text, config.blocklist);
  assert.equal(find("Isso é uma MERDA!"), "merda");
  assert.equal(find("que m3rd4 de dia"), "merda");
  assert.equal(find("seu idiotaaa"), "idiota", "palavra longa: casa pelo começo (plural, alongamento)");
  assert.equal(find("idiotas"), "idiota");
  assert.equal(find("você é viado"), "viado");
  assert.equal(find("viadinho"), null, "palavra curta de 5 letras ou menos só casa inteira");
  assert.equal(find("computação e cultura"), null, "pedaço no meio de palavra não conta");
  assert.equal(find("disputa de computação"), null, "'puta' dentro de 'disputa' não conta");
  assert.equal(find("Vim aprender e trocar ideia"), null);
  assert.equal(find(""), null);
});

test("validar: devolve o recado limpo e recusa com o motivo: vazio, grande demais, apelido grande, pergunta desconhecida, dado pessoal e palavra ofensiva", () => {
  assert.deepEqual({ ...validateWallPost(post({ text: "  Vim   pra aprender ", nickname: " Ana " }), config) }, { text: "Vim pra aprender", nickname: "Ana", prompt: "buscar" });
  assert.throws(() => validateWallPost(post({ text: "   " }), config), /escreva o recado/);
  assert.throws(() => validateWallPost(post({ text: "x".repeat(41) }), config), /passa de 40 caracteres/);
  assert.doesNotThrow(() => validateWallPost(post({ text: "x".repeat(40) }), config));
  assert.throws(() => validateWallPost(post({ nickname: "apelido grande" }), config), /apelido passa de 8/);
  assert.throws(() => validateWallPost(post({ prompt: "nada" }), config), /escolha uma pergunta/);
  assert.throws(() => validateWallPost(post({ prompt: undefined }), config), /escolha uma pergunta/);
  for (const text of ["veja meu site http://x.co", "www.site.com", "fale em a@b.com", "ligue 19 99999-8888", "11999998888"]) assert.throws(() => validateWallPost(post({ text }), config), /link, e-mail nem telefone/, text);
  assert.throws(() => validateWallPost(post({ text: "que merda" }), config), /não podemos mostrar/);
  assert.throws(() => validateWallPost(post({ nickname: "puta" }), config), /não podemos mostrar/, "o apelido também passa pelo filtro");
  assert.doesNotThrow(() => validateWallPost(post({ text: "Estou no ano de 2026" }), config), "número curto não é telefone");
});

test("espaço do aparelho: o primeiro livre de 1 a N, ou null quando acabaram; o documento sai pendente, com o apelido só quando existe", () => {
  assert.equal(nextWallSlot(new Set(), 3), 1);
  assert.equal(nextWallSlot(new Set([1, 3]), 3), 2);
  assert.equal(nextWallSlot(new Set([1, 2, 3]), 3), null);
  assert.deepEqual(wallEntry({ text: "t", nickname: "", prompt: "buscar" }, 2), { entryKey: "wall-2", text: "t", prompt: "buscar", status: "pending" });
  assert.deepEqual(wallEntry({ text: "t", nickname: "Ana", prompt: "recado" }, 1), { entryKey: "wall-1", text: "t", prompt: "recado", status: "pending", nickname: "Ana" });
});
