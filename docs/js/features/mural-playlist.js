/**
 * Regras PURAS do rodízio do mural (sem DOM, sem relógio próprio; dual: navegador e Node, testado em DevFestIA/tools/mural).
 * Cada cena é um dado (data/mural-scenes.js). Aqui só se decide QUAL cena vem a seguir:
 *   sceneAvailable      a cena pode aparecer agora? (ligada, janela de datas, line-up revelado, fase do evento, fonte ao vivo pronta)
 *   pickNextScene       interrupção de maior prioridade primeiro; senão a próxima da fila que esteja disponível e fora do castigo
 *   pruneInterrupts     descarta as vencidas e a que acabou de ser usada
 *   withCooldown        põe uma cena de castigo depois de falhar (volta sozinha quando o tempo passa)
 *   filterScenesByIds   `?cenas=a,b` mostra só essas, na ordem pedida
 * `ctx` = { now: Date do evento (pode ser simulado), reveal, phase, live: { [fonte]: valor } }; `nowMs` = relógio real (castigos e vencimentos).
 */
function sceneAvailable(scene, ctx) {
  const requires = scene.requires ?? {};
  const time = ctx.now.getTime();
  return scene.enabled !== false
    && (!scene.from || time >= Date.parse(scene.from))
    && (!scene.until || time < Date.parse(scene.until))
    && (!requires.reveal || Boolean(ctx.reveal))
    && (!requires.phases || requires.phases.includes(ctx.phase))
    && (!requires.live || Boolean(ctx.live?.[requires.live]));
}

function pickNextScene({ scenes, currentId = null, interrupts = [], cooldowns = {}, ctx, nowMs }) {
  const usable = scene => sceneAvailable(scene, ctx) && !(cooldowns[scene.id] > nowMs);
  const waiting = interrupts
    .filter(interrupt => interrupt.expiresAt > nowMs)
    .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  for (const interrupt of waiting) {
    const scene = scenes.find(candidate => candidate.id === interrupt.sceneId);
    if (scene && usable(scene)) return { scene, interrupt };
  }
  const start = scenes.findIndex(scene => scene.id === currentId);
  for (let step = 1; step <= scenes.length; step++) {
    const scene = scenes[(start + step + scenes.length) % scenes.length];
    if (usable(scene)) return { scene, interrupt: null };
  }
  return null;
}

function pruneInterrupts(interrupts, nowMs, used = null) {
  return interrupts.filter(interrupt => interrupt !== used && interrupt.expiresAt > nowMs);
}

function withCooldown(cooldowns, sceneId, nowMs, ms) {
  return { ...cooldowns, [sceneId]: nowMs + ms };
}

/** Só as cenas pedidas, na ordem pedida; ids desconhecidos são ignorados e, se nenhum valer, a lista inteira continua (link errado não deixa o telão vazio). */
function filterScenesByIds(scenes, ids) {
  if (!ids?.length) return scenes;
  const picked = ids.map(id => scenes.find(scene => scene.id === id)).filter(Boolean);
  return picked.length ? picked : scenes;
}

if (typeof module !== "undefined") module.exports = { sceneAvailable, pickNextScene, pruneInterrupts, withCooldown, filterScenesByIds };
