/**
 * Escapa texto digitado por alguém (nome, pergunta, comentário) antes de ele entrar num template HTML. Único lugar
 * dessa regra: todo componente que mostra texto de fora passa por aqui.
 */
function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
