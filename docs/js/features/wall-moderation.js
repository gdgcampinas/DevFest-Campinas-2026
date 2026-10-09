/**
 * Regras PURAS da moderação dos recados (dual: navegador e Node, testadas em DevFestIA/tools/mural/wall-moderation.test.js): agrupar os recados por estado e traduzir o botão no estado novo.
 *   groupWallPosts   { pending (do mais antigo pro mais novo: quem mandou primeiro é atendido primeiro), approved (no telão, do mais novo pro mais antigo), other (recusados e tirados do ar, do mais novo) }
 *   wallStatusFor    o estado que cada botão grava: approve e restore = approved, reject = rejected, hide = hidden (qualquer outro nome lança, pra botão torto nunca gravar estado inventado)
 */
const WALL_ACTION_STATUS = { approve: "approved", restore: "approved", reject: "rejected", hide: "hidden" };

function wallStatusFor(action) {
  if (!(action in WALL_ACTION_STATUS)) throw new Error(`ação desconhecida: ${action}`);
  return WALL_ACTION_STATUS[action];
}

function groupWallPosts(posts) {
  const byAge = (a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0);
  const pending = posts.filter(post => post.status === "pending").sort(byAge);
  const approved = posts.filter(post => post.status === "approved").sort((a, b) => byAge(b, a));
  const other = posts.filter(post => post.status !== "pending" && post.status !== "approved").sort((a, b) => byAge(b, a));
  return { pending, approved, other };
}

if (typeof module !== "undefined") module.exports = { groupWallPosts, wallStatusFor, WALL_ACTION_STATUS };
