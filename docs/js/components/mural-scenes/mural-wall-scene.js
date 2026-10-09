/**
 * Cena do MURAL DE RECADOS: os recados que a plateia mandou e o moderador aprovou (`ctx.live.wall`, fonte `wall` de data/mural-sources.js), como notinhas coloridas nas cores do Google. Cada passada
 * mostra uma "página" de `params.count` recados (padrão 6); a próxima passada, a página seguinte (`rotation`), dando a volta. `params.prompt` filtra a pergunta (cada pergunta tem a sua cena e o texto grande
 * da pergunta no topo). Com menos de `params.min` recados (padrão 3) a cena não aparece: um recado sozinho no telão não faz mural. O texto é da plateia: sempre escapado.
 * Tudo injetado: `promptLabelOf(id)` (o texto da pergunta, data/wall-config.js) e `rotation` (features/mural-rotation.js).
 */
const WALL_NOTE_COLORS = ["var(--google-blue)", "var(--google-red)", "var(--google-yellow)", "var(--google-green)"];

function createWallScene({ promptLabelOf, rotation }) {
  return {
    prepare(params, ctx) {
      const all = [...(ctx.live.wall ?? [])].filter(post => !params.prompt || post.prompt === params.prompt).sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      if (all.length < (params.min ?? 3)) return MURAL_SKIP;
      const count = params.count ?? 6;
      const page = rotation.next(`wall:${params.prompt ?? "todas"}`, Math.ceil(all.length / count));
      return all.slice(page * count, page * count + count);
    },
    render(posts, params) {
      const notes = posts.map((post, index) => `<li class="ms-wall-note ms-stagger" style="--i:${index};--note:${WALL_NOTE_COLORS[index % WALL_NOTE_COLORS.length]};--tilt:${[-2, 1.5, -1, 2.2][index % 4]}deg"><p>${escapeHtml(post.text)}</p>${post.nickname ? `<span>${escapeHtml(post.nickname)}</span>` : ""}</li>`).join("");
      return { markup: `<section class="ms ms-wall">${muralHeadMarkup({ kicker: params.kicker ?? "Recados da galera", title: params.prompt ? promptLabelOf(params.prompt) : params.title })}<ul class="ms-wall-notes" data-count="${posts.length}">${notes}</ul></section>` };
    },
  };
}
