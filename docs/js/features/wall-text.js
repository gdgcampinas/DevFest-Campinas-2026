/**
 * Regras PURAS do texto do mural de recados (dual: navegador e Node, testadas em DevFestIA/tools/mural/wall-text.test.js): limpar, recusar palavra ofensiva e dado pessoal (link, e-mail, telefone) e montar
 * o documento do recado. É o filtro de PRIMEIRA linha (a página avisa antes de enviar): quem decide o que vai ao telão é SEMPRE o moderador, e as regras do Firestore são a defesa final.
 *   cleanWallText       espaços limpos e cortado no tamanho
 *   findBlockedWord     a palavra da lista proibida que aparece no texto (sem acento, sem maiúscula, trocando 0/1/3/4/5/@/$ pelas letras), ou null. Casa a palavra INTEIRA (ou o começo dela, pra palavras
 *                       de 5 letras ou mais, pega o plural), nunca um pedaço no meio de outra palavra ("cultura" não casa com "cu")
 *   validateWallPost    devolve { text, nickname, prompt } limpos ou lança Error com o motivo em português
 *   nextWallSlot        o próximo espaço livre do aparelho (1 a `maxPerPerson`) pelos espaços já usados, ou null se acabaram
 *   fillWallText        troca `{nome}` do texto pelos valores (`{from}` e `{until}` na mensagem "os recados abrem..."); chave sem valor vira vazio
 *   wallEntry           o documento a gravar: { entryKey, text, prompt, status: "pending", nickname? }
 */
const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", "@": "a", $: "s" };
const PERSONAL_DATA = /https?:|www\.|\S+@\S+\.\S+|\b(?:\d[\s.()-]?){8,}\b/i;

const cleanWallText = (text, max = Infinity) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);

function findBlockedWord(text, blocklist) {
  const normalized = String(text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[0134@$5]/g, char => LEET[char]);
  const tokens = normalized.split(/[^a-z]+/).filter(Boolean);
  return blocklist.find(word => tokens.some(token => token === word || (word.length >= 5 && token.startsWith(word)))) ?? null;
}

function validateWallPost({ text, nickname = "", prompt }, config) {
  const clean = cleanWallText(text);
  const nick = cleanWallText(nickname);
  if (!clean) throw new Error("escreva o recado");
  if (clean.length > config.maxLength) throw new Error(`o recado passa de ${config.maxLength} caracteres`);
  if (nick.length > config.maxNickname) throw new Error(`o apelido passa de ${config.maxNickname} caracteres`);
  if (!config.prompts.some(item => item.id === prompt)) throw new Error("escolha uma pergunta");
  if (PERSONAL_DATA.test(clean) || PERSONAL_DATA.test(nick)) throw new Error("não coloque link, e-mail nem telefone: o recado aparece no telão");
  if (findBlockedWord(clean, config.blocklist) || findBlockedWord(nick, config.blocklist)) throw new Error("tem palavra que não podemos mostrar no telão");
  return { text: clean, nickname: nick, prompt };
}

function nextWallSlot(usedSlots, maxPerPerson) {
  for (let slot = 1; slot <= maxPerPerson; slot++) if (!usedSlots.has(slot)) return slot;
  return null;
}

const fillWallText = (template, values = {}) => String(template).replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? "");

function wallEntry({ text, nickname, prompt }, slot) {
  return { entryKey: `wall-${slot}`, text, prompt, status: "pending", ...(nickname ? { nickname } : {}) };
}

if (typeof module !== "undefined") module.exports = { cleanWallText, findBlockedWord, validateWallPost, nextWallSlot, fillWallText, wallEntry };
