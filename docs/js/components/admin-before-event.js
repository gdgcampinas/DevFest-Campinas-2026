/**
 * Marcação da seção "Antes do evento" do admin: duas caixas, a limpeza do BANCO (texto e passos; o botão é um link pro GitHub, onde ela roda com as travas) e a limpeza DESTE APARELHO (botão em dois
 * toques e o resultado). `config` vem de data/admin-sections.js; `device` = { armed, busy, rows } (o que a área viva do aparelho mostra). Só texto escapado e classes do styles.css (.mod, .chip-btn) e css/admin.css.
 */
function adminBeforeEventShellMarkup({ config }) {
  const { purge, device } = config;
  return `<ul class="ad-list">
    <li class="ad-card" data-card="purge">
      ${adminCardHeadMarkup({ title: purge.title, subtitle: purge.description, icon: "checklist" })}
      <p class="mod-hint">Apaga:</p>
      <ul class="ad-lines">${purge.clears.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p class="mod-hint">${escapeHtml(purge.keeps)}</p>
      <ol class="ad-lines ad-steps">${purge.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      <p class="mod-hint mod-notice">${escapeHtml(purge.lock)}</p>
      <div class="ad-links"><a class="chip-btn chip-btn--primary" href="${escapeHtml(purge.workflowUrl)}" target="_blank" rel="noopener">${escapeHtml(purge.buttonLabel)}</a></div>
    </li>
    <li class="ad-card" data-card="device">
      ${adminCardHeadMarkup({ title: device.title, subtitle: device.description, icon: "screen" })}
      <p class="mod-hint mod-notice">${escapeHtml(device.warning)}</p>
      <div data-slot="device"></div>
    </li>
  </ul>`;
}

function adminDeviceSlotMarkup({ config, armed = false, busy = false, rows = null, failed = false }) {
  const { device } = config;
  if (rows) return `<p class="ad-headline is-ok">${escapeHtml(device.doneText)}</p><ul class="ad-lines">${rows.map(([label, count]) => `<li>${escapeHtml(label)}: ${count}</li>`).join("")}</ul>`;
  return `${failed ? `<p class="mod-hint mod-notice" role="status">${escapeHtml(device.failedText)}</p>` : ""}<div class="ad-links"><button type="button" class="chip-btn chip-btn--danger" data-device-reset${busy ? " disabled" : ""}>${escapeHtml(armed ? device.confirmLabel : device.buttonLabel)}</button></div>`;
}
