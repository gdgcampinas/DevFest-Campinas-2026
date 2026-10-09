/**
 * Marcação da seção Recados do admin: três caixas (para aprovar, no telão, recusados e tirados do ar), cada recado com o texto, a pergunta, o apelido e a hora e os botões do estado dele. Só texto escapado
 * e classes do styles.css (.mod, .chip-btn) e do css/admin.css; os hooks são `data-*` (features/admin-wall.js). O texto é da plateia: sempre escapado.
 */
function adminWallShellMarkup({ text }) {
  return `<p class="mod-hint">${escapeHtml(text.intro)}</p>
    <div data-slot="message"></div>
    <div class="ad-cols ad-cols--wall">
      <section class="ad-card">${adminCardHeadMarkup({ title: text.pendingTitle, subtitle: text.pendingHint, icon: "chat" })}<div data-slot="pending"></div></section>
      <section class="ad-card">${adminCardHeadMarkup({ title: text.liveTitle, subtitle: text.liveHint, icon: "screen" })}<div data-slot="approved"></div></section>
    </div>
    <section class="ad-card ad-card--wide">${adminCardHeadMarkup({ title: text.otherTitle, subtitle: text.otherHint })}<div data-slot="other"></div></section>`;
}

const WALL_BUTTONS = {
  pending: [{ action: "approve", primary: true }, { action: "reject", danger: true }],
  approved: [{ action: "hide", danger: true }],
  rejected: [{ action: "approve" }],
  hidden: [{ action: "restore", primary: true }],
};

function adminWallListMarkup({ posts, text, promptLabelOf, formatTime, busyId = null }) {
  if (!posts.length) return `<p class="mod-hint">${escapeHtml(text.empty)}</p>`;
  const row = post => {
    const meta = [promptLabelOf(post.prompt), post.nickname ? `${text.by} ${post.nickname}` : "", post.createdAtMs ? formatTime(post.createdAtMs) : ""].filter(Boolean).join(" · ");
    const buttons = (WALL_BUTTONS[post.status] ?? []).map(({ action, primary, danger }) => `<button type="button" class="chip-btn${primary ? " chip-btn--primary" : ""}${danger ? " chip-btn--danger" : ""}" data-wall-action="${action}" data-wall-id="${escapeHtml(post.id)}"${busyId === post.id ? " disabled" : ""}>${escapeHtml(text.actions[action])}</button>`).join("");
    return `<li class="ad-note" data-status="${escapeHtml(post.status)}"><p class="ad-note-text">${escapeHtml(post.text)}</p><span class="ad-note-meta">${escapeHtml(meta)}${post.status === "rejected" || post.status === "hidden" ? ` · ${escapeHtml(text.statusName[post.status])}` : ""}</span><div class="ad-links">${buttons}</div></li>`;
  };
  return `<ul class="ad-notes">${posts.map(row).join("")}</ul>`;
}
