/**
 * Janela de horário das perguntas de uma palestra. Função pura, arquivo "dual" (navegador e Node).
 * As regras do Firestore aceitam pergunta e voto do início ao fim da palestra (limites inclusos), com base no
 * relógio do servidor; a tela espelha isso pra mostrar o formulário só quando o banco vai aceitar.
 * `slot` é um item da grade ({ start, end } como Date); `now` é um Date (respeita ?demo=). `enforce` falso (teste em
 * DEV) mantém sempre aberto, como as regras quando a trava de horário está desligada.
 * Devolve "before" (ainda não começou), "open" (pode perguntar e votar) ou "closed" (já acabou).
 */
function questionWindowState(slot, now, { enforce = true } = {}) {
  if (!enforce) return "open";
  if (now < slot.start) return "before";
  if (now > slot.end) return "closed";
  return "open";
}

if (typeof module !== "undefined") module.exports = { questionWindowState };
