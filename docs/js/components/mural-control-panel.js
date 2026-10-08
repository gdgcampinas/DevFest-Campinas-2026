/**
 * Marcação da tela do moderador do CONTROLE do mural (mural-controle.html). Duas peças:
 *   muralControlShellMarkup   o esqueleto do formulário, desenhado UMA vez (quem digita não perde o texto quando o estado do mural muda); cada área viva é um `data-slot`
 *   muralControlSlots         o conteúdo de cada área viva (estado, avisos no ar, parada do telão, emergência), refeito a cada mudança
 * `embedded` (dentro da área de admin, que já tem a conta e o título) omite a conta e o título. Só texto escapado e classes do styles.css (.mod, .chip-btn, .feedback-input) e do css/mod-tools.css. Os hooks de clique são `data-*` (features/mural-control-panel.js).
 */
function muralControlShellMarkup({ email, limits, scenes, templates, embedded = false }) {
  const chips = (attr, values, selected, label) => values.map(value => `<button type="button" class="chip-btn${value === selected ? " chip-btn--primary" : ""}" ${attr}="${value}">${label(value)}</button>`).join("");
  const templateButtons = (list, attr) => list.map(text => `<button type="button" class="chip-btn" ${attr}="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join("");
  return `${embedded ? "" : `${moderatorAccountMarkup(email)}
    <h1 class="mod-title">Controle do telão</h1>`}
    <div data-slot="status"></div>
    <section class="mod-section mc-card">
      <h2 class="mod-section-title">Aviso ao vivo</h2>
      <p class="mod-hint">Aparece no telão na hora e some sozinho quando o tempo acaba.</p>
      <div class="mc-chips">${templateButtons(templates.notice, "data-notice-template")}</div>
      <textarea class="feedback-input" data-notice-text maxlength="${limits.maxTextLength}" rows="2" placeholder="Escreva o aviso (até ${limits.maxTextLength} caracteres)"></textarea>
      <div class="mc-chips" data-slot="kind"></div>
      <div class="mc-chips" data-slot="durations"></div>
      <button type="button" class="chip-btn chip-btn--primary" data-notice-publish>Publicar aviso</button>
      <div data-slot="notices"></div>
    </section>
    <section class="mod-section mc-card">
      <h2 class="mod-section-title">Parar o rodízio</h2>
      <p class="mod-hint">Pausar mantém a cena que está no ar; fixar escolhe uma cena. Solta sozinho quando o tempo acaba.</p>
      <select class="feedback-input" data-hold-scene>${scenes.map(scene => `<option value="${escapeHtml(scene.id)}">${escapeHtml(scene.label)}</option>`).join("")}</select>
      <div class="mc-chips" data-slot="hold-durations"></div>
      <div class="mc-chips"><button type="button" class="chip-btn" data-hold-pause>Pausar a cena atual</button><button type="button" class="chip-btn" data-hold-pin>Fixar a cena escolhida</button></div>
      <div data-slot="hold"></div>
    </section>
    <section class="mod-section mc-card">
      <h2 class="mod-section-title">Recarregar o telão</h2>
      <p class="mod-hint">Recarrega a página do mural agora (se ele estiver estranho). Volta sozinho para onde estava.</p>
      <button type="button" class="chip-btn" data-reload>Recarregar o mural</button>
    </section>
    <section class="mod-section mc-card mc-card--danger">
      <h2 class="mod-section-title">Emergência</h2>
      <p class="mod-hint">Cobre o telão inteiro com o texto e PARA tudo até você desarmar. Exige dois toques.</p>
      <div class="mc-chips">${templateButtons(templates.emergency, "data-emergency-template")}</div>
      <textarea class="feedback-input" data-emergency-text maxlength="${limits.maxEmergencyLength}" rows="2" placeholder="Texto da emergência (até ${limits.maxEmergencyLength} caracteres)"></textarea>
      <div data-slot="emergency"></div>
    </section>
    <div data-slot="message"></div>`;
}

/** As áreas vivas. `state` já vem normalizado (features/mural-control.js); `ui` é o que a tela escolheu (tipo, durações, confirmação da emergência). */
function muralControlSlots({ state, ui, limits, sceneLabel, formatTime, busy = false }) {
  const disabled = busy ? " disabled" : "";
  const minutes = value => `${value >= 60 ? `${value / 60} h` : `${value} min`}`;
  const choice = (attr, values, selected) => values.map(value => `<button type="button" class="chip-btn${value === selected ? " chip-btn--primary" : ""}" ${attr}="${value}">${minutes(value)}</button>`).join("");
  const holdText = state.hold ? `${state.hold.sceneId ? `fixo em "${sceneLabel(state.hold.sceneId)}"` : "pausado"} até ${formatTime(state.hold.until)}` : "rodando sozinho";
  return {
    status: `<p class="mod-hint mc-status${state.emergency ? " is-emergency" : ""}" role="status">${state.emergency ? "EMERGÊNCIA ARMADA" : "Telão normal"} · ${escapeHtml(holdText)} · ${state.notices.length} aviso(s) no ar</p>`,
    kind: `<button type="button" class="chip-btn${ui.kind === "info" ? " chip-btn--primary" : ""}" data-notice-kind="info">Aviso</button><button type="button" class="chip-btn${ui.kind === "alert" ? " chip-btn--danger" : ""}" data-notice-kind="alert">Alerta</button>`,
    durations: `<span class="mod-hint">Fica no ar:</span>${choice("data-notice-minutes", limits.noticeMinutes, ui.noticeMinutes)}`,
    "hold-durations": `<span class="mod-hint">Por quanto tempo:</span>${choice("data-hold-minutes", limits.holdMinutes, ui.holdMinutes)}`,
    notices: state.notices.length
      ? `<ul class="mc-list">${[...state.notices].reverse().map(notice => `<li class="mc-notice${notice.kind === "alert" ? " is-alert" : ""}"><span>${escapeHtml(notice.text)} <small>até ${escapeHtml(formatTime(notice.until))}</small></span><button type="button" class="chip-btn chip-btn--danger" data-notice-remove="${escapeHtml(notice.id)}"${disabled}>Remover</button></li>`).join("")}</ul>`
      : '<p class="mod-hint">Nenhum aviso no ar.</p>',
    hold: state.hold ? `<button type="button" class="chip-btn chip-btn--primary" data-hold-release${disabled}>Soltar o rodízio</button>` : "",
    emergency: state.emergency
      ? `<p class="mc-emergency-now">${escapeHtml(state.emergency.text)}</p><button type="button" class="chip-btn chip-btn--primary" data-emergency-disarm${disabled}>Desarmar emergência</button>`
      : `<button type="button" class="chip-btn chip-btn--danger" data-emergency-arm${disabled}>${ui.emergencyConfirm ? "Toque de novo para CONFIRMAR" : "Armar emergência"}</button>`,
    message: ui.message ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(ui.message)}</p>` : "",
  };
}
