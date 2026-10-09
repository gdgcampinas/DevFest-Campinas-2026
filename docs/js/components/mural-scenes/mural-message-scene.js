/**
 * Cena de MENSAGEM: um texto grande e acolhedor por dado, com a etiqueta e uma linha de apoio (quebra-gelo, "Primeira vez aqui?", saudação por horário). Qual conjunto vai ao ar vem de
 * `params.set` (data/mural-messages.js) e a escolha da frase de features/mural-messages.js. O Gumbleton fica no canto quando `params.mascot` (e a imagem carregou: sem imagem a cena segue sem ele).
 * Sem frase pra agora (conjunto desconhecido, horário fora de toda janela, variável vazia sem texto de reserva) a cena não aparece. Tudo injetado: `repository` (conjuntos e variáveis), `rotation`
 * (features/mural-rotation.js), `timezone`, `formatTime(date, timezone)`, `preload` e `mascotUrl`.
 */
function createMessageScene({ repository, rotation, timezone, formatTime, preload, mascotUrl }) {
  return {
    async prepare(params, ctx) {
      const set = repository.getAll()[params.set];
      if (!set) return MURAL_SKIP;
      const index = set.mode === "rotate" ? rotation.next(params.set, set.items.length) : 0;
      const item = pickMessage({ set, index, localTime: formatTime(ctx.now, timezone), moment: ctx.moment });
      const message = item ? fillMessage(item, repository.vars()) : null;
      if (!message) return MURAL_SKIP;
      const mascot = params.mascot && mascotUrl ? await preload(mascotUrl).then(() => mascotUrl, () => null) : null;
      return { kicker: set.kicker, message, mascot, set: params.set };
    },
    render({ kicker, message, mascot, set }) {
      return {
        markup: `<section class="ms ms-message" data-set="${escapeHtml(set)}">
          <div class="ms-message-body"><span class="ms-kicker">${escapeHtml(kicker)}</span><p class="ms-message-text">${escapeHtml(message.text)}</p>${message.hint ? `<p class="ms-hint ms-message-hint">${escapeHtml(message.hint)}</p>` : ""}</div>
          ${mascot ? muralMascotMarkup(mascot, "ms-message-mascot") : ""}
        </section>`,
      };
    },
  };
}
