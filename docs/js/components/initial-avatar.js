/**
 * Avatar de iniciais: um círculo com a primeira letra do texto (e-mail ou nome) e uma cor que sai do próprio texto (a mesma pessoa tem sempre a mesma cor). Só texto escapado.
 * Usado na barra da conta e na lista de moderadores do admin.
 */
function initialAvatarMarkup(label, { size = 36 } = {}) {
  const text = String(label ?? "").trim();
  const hue = [...text].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 360, 7);
  return `<span class="ad-avatar" style="--size:${size}px;--hue:${hue}" aria-hidden="true">${escapeHtml((text[0] ?? "?").toUpperCase())}</span>`;
}
