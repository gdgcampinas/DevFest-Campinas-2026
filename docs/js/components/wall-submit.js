/**
 * Marcação da página de enviar RECADO (recado.html, o QR do telão leva aqui). Duas peças: o formulário, desenhado UMA vez (quem digita não perde o texto quando o estado muda), e a área viva
 * (`data-slot`: aviso, contagem de caracteres, "enviado!"). Só texto escapado e classes do styles.css (.chip-btn, .feedback-input) e do css/wall.css; os hooks são `data-*` (features/wall-submit.js).
 */
function wallSubmitShellMarkup({ config, text }) {
  const prompts = config.prompts.map((prompt, index) => `<label class="wall-prompt"><input type="radio" name="prompt" value="${escapeHtml(prompt.id)}"${index === 0 ? " checked" : ""} data-wall-prompt><span>${escapeHtml(prompt.label)}</span></label>`).join("");
  return `<form class="wall-form" data-wall-form novalidate>
      <fieldset class="wall-prompts"><legend class="wall-legend">${escapeHtml(text.promptLegend)}</legend>${prompts}</fieldset>
      <label class="wall-field"><span>${escapeHtml(text.textLabel)}</span><textarea class="feedback-input" name="text" rows="3" maxlength="${config.maxLength}" placeholder="${escapeHtml(config.prompts[0].placeholder)}" data-wall-text></textarea><small class="wall-count" data-slot="count"></small></label>
      <label class="wall-field"><span>${escapeHtml(text.nicknameLabel)}</span><input class="feedback-input" name="nickname" maxlength="${config.maxNickname}" autocomplete="off" data-wall-nickname></label>
      <p class="mod-hint">${escapeHtml(text.privacy)}</p>
      <button type="submit" class="chip-btn chip-btn--primary wall-send" data-wall-send>${escapeHtml(text.send)}</button>
      <div data-slot="message"></div>
    </form>`;
}

/** Os estados que trocam a página inteira: carregando, fechado, limite de recados e enviado. */
function wallStateMarkup({ state, text, remaining = 0 }) {
  const body = {
    loading: `<p class="mod-hint">${escapeHtml(text.loading)}</p>`,
    closed: `<p class="wall-state">${escapeHtml(text.closed)}</p>`,
    limit: `<p class="wall-state">${escapeHtml(text.limit)}</p>`,
    sent: `<p class="wall-state is-ok">${escapeHtml(text.sent)}</p>${remaining ? `<button type="button" class="chip-btn" data-wall-again>${escapeHtml(text.again)} (${remaining})</button>` : `<p class="mod-hint">${escapeHtml(text.noMore)}</p>`}`,
  }[state];
  return body;
}

function wallMessageMarkup(message) {
  return message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(message)}</p>` : "";
}
