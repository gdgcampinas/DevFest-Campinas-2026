/** Marcação do painel da equipe (equipe.html): uma cartão por ferramenta e, nas que são por trilha, um link por trilha com a cor dela. Só texto escapado e classes do styles.css (.mod) e css/team-tools.css. */
function teamToolsMarkup({ tools, tracks }) {
  const card = tool => {
    const links = tool.perTrack
      ? tracks.map(track => `<a class="chip-btn" href="${escapeHtml(`${tool.href}?trilha=${track.id}`)}" style="--track-color:${escapeHtml(track.color)}">${escapeHtml(track.label)}</a>`).join("")
      : `<a class="chip-btn chip-btn--primary" href="${escapeHtml(tool.href)}">Abrir</a>`;
    return `<li class="tt-card" data-tool="${escapeHtml(tool.id)}"><h2 class="mod-section-title">${escapeHtml(tool.title)}</h2><p class="mod-hint">${escapeHtml(tool.description)}</p><div class="tt-links">${links}</div></li>`;
  };
  return `<h1 class="mod-title">Painel da equipe</h1><p class="mod-hint">Atalhos das telas internas do evento. As de moderação pedem login com a conta Google de moderador.</p><ul class="tt-list">${tools.map(card).join("")}</ul>`;
}
