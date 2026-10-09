/**
 * Regra PURA das legendas do telão (dual: navegador e Node, testada em DevFestIA/tools/mural/captions.test.js): qual frase aparece no segundo `seconds` do clipe. Os cues (data/mural-captions.js) são
 * { from, to, text } em segundos dentro do clipe; vale `from <= seconds < to`; fora de qualquer frase devolve "" (a legenda some). Cues fora de ordem funcionam (a primeira que casar).
 */
function captionAt(cues, seconds) {
  return cues.find(cue => seconds >= cue.from && seconds < cue.to)?.text ?? "";
}

if (typeof module !== "undefined") module.exports = { captionAt };
