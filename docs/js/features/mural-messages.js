/**
 * Regras PURAS das mensagens do mural (data/mural-messages.js): preencher as variáveis de uma frase e escolher qual frase de um conjunto vai ao ar agora. Dual (navegador e Node),
 * testado em DevFestIA/tools/mural/messages.test.js.
 *   fillMessage   troca `{nome}` pelo valor de `vars`; variável vazia ou inexistente faz o texto e a linha de apoio caírem nos `fallback*` do item (sem fallback, a linha some e o item é descartado
 *                 se for o texto). Devolve { text, hint } ou null.
 *   pickMessage   o item do conjunto pra agora: "rotate" usa a posição pedida (`index`), "fixed" o primeiro, "daypart" o do bloco da grade no ar (`moment`) e, sem ele, o da janela de horário (`localTime`
 *                 "HH:MM" no fuso do evento; a janela pode passar da meia-noite). Devolve o item ou null.
 */
const MESSAGE_VARIABLE = /\{(\w+)\}/g;

function fillText(text, vars) {
  let missing = false;
  const filled = text.replace(MESSAGE_VARIABLE, (_match, name) => {
    const value = vars[name];
    if (!value) missing = true;
    return value ?? "";
  });
  return missing ? null : filled;
}

function fillMessage(item, vars = {}) {
  const text = fillText(item.text, vars) ?? (item.fallbackText ? fillText(item.fallbackText, vars) : null);
  if (text === null) return null;
  const hint = item.hint ? fillText(item.hint, vars) ?? (item.fallbackHint ? fillText(item.fallbackHint, vars) : null) : null;
  return { text, hint };
}

const inWindow = (time, from, until) => (from <= until ? time >= from && time < until : time >= from || time < until);

function pickMessage({ set, index = 0, localTime = "12:00", moment = null }) {
  const items = set.items ?? [];
  if (!items.length) return null;
  if (set.mode === "rotate") return items[((index % items.length) + items.length) % items.length];
  if (set.mode === "daypart") {
    return items.find(item => item.moments && item.moments.includes(moment))
      ?? items.find(item => item.from && item.until && inWindow(localTime, item.from, item.until))
      ?? null;
  }
  return items[0];
}

if (typeof module !== "undefined") module.exports = { fillMessage, pickMessage };
