/**
 * Marcação da seção Palestras do admin: uma caixa por trilha (cor e sala da trilha), a palestra no ar ou a próxima e os botões que abrem as telas dela, SEMPRE em aba própria (a moderação de
 * perguntas publica o quadro da sala enquanto está aberta, então cada trilha precisa da sua aba). `rooms` vem de features/admin-talks.js com `lineOf` (o texto da palestra) e `links` já prontos.
 * Só texto escapado e classes do styles.css (.mod, .chip-btn) e do css/admin.css.
 */
function adminTalksMarkup({ rooms }) {
  const card = room => `<li class="ad-card" data-track="${escapeHtml(room.track.id)}" style="--track-color:${escapeHtml(room.track.color)}">${adminCardHeadMarkup({ title: `${room.track.label} · ${room.track.room}`, subtitle: room.lineOf })}<div class="ad-links">${room.links.map(link => `<a class="chip-btn" data-link="${escapeHtml(link.id)}" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">${escapeHtml(link.label)}</a>`).join("")}</div></li>`;
  return `<p class="mod-hint">Cada tela abre em aba própria. A moderação de perguntas atualiza o quadro que a plateia vê enquanto está aberta: deixe aberta só a aba da trilha que você está moderando.</p><ul class="ad-list">${rooms.map(card).join("")}</ul>`;
}
