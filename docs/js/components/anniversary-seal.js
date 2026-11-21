/**
 * Componente: o SELO REDONDO de aniversário do telão (só marcação, tudo escapado): medalhão com o anel nas quatro cores do Google, faixa azul em cima ("DEVFEST CAMPINAS"), faixa vermelha embaixo
 * ("2016 · 2026": o primeiro DevFest e a edição de hoje), ramos de folhas verdes e o número de anos do DevFest grande no centro, com um brilho que passa por cima (CSS: .mural-seal).
 * Por parâmetro: `years` ({ devfest }), `firstDevFest`, `eventYear` e `text` (ANNIVERSARY_TEXTS.seal: `top`, `unit`, `label`). O SVG leva o rótulo pra leitores de tela.
 */
function anniversarySealMarkup({ years, firstDevFest, eventYear, text }) {
  const leaves = [[50, 88, -25], [45, 100, -8], [45, 112, 10], [50, 123, 28], [150, 88, 25], [155, 100, 8], [155, 112, -10], [150, 123, -28]]
    .map(([x, y, angle]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="8" transform="rotate(${angle} ${x} ${y})"/>`).join("");
  const label = escapeHtml(text.label.replace("{devfest}", years.devfest));
  return `<svg class="seal-svg" viewBox="0 0 200 200" role="img" aria-label="${label}">
    <defs><clipPath id="sealClip"><circle cx="100" cy="100" r="93"/></clipPath>
      <path id="sealTop" d="M51.5 72 A56 56 0 0 1 148.5 72"/><path id="sealBottom" d="M41.1 134 A68 68 0 0 0 158.9 134"/></defs>
    <path d="M100 12 A88 88 0 0 1 188 100" fill="none" stroke="#4285f4" stroke-width="10"/>
    <path d="M188 100 A88 88 0 0 1 100 188" fill="none" stroke="#ea4335" stroke-width="10"/>
    <path d="M100 188 A88 88 0 0 1 12 100" fill="none" stroke="#fbbc04" stroke-width="10"/>
    <path d="M12 100 A88 88 0 0 1 100 12" fill="none" stroke="#34a853" stroke-width="10"/>
    <circle cx="100" cy="100" r="80" fill="#0b0d18" stroke="#fff3c4" stroke-width="1.5"/>
    <path d="M46.3 69 A62 62 0 0 1 153.7 69" fill="none" stroke="#4285f4" stroke-width="20"/>
    <path d="M46.3 131 A62 62 0 0 0 153.7 131" fill="none" stroke="#ea4335" stroke-width="20"/>
    <text font-size="9" font-weight="700" fill="#fff" letter-spacing=".8" text-anchor="middle"><textPath href="#sealTop" startOffset="50%">${escapeHtml(text.top)}</textPath></text>
    <text font-size="9" font-weight="700" fill="#fff" letter-spacing="1.6" text-anchor="middle"><textPath href="#sealBottom" startOffset="50%">${escapeHtml(`${firstDevFest} · ${eventYear}`)}</textPath></text>
    <g fill="#34a853">${leaves}</g>
    <text x="100" y="116" font-size="56" font-weight="800" fill="#fbbc04" stroke="#fff3c4" stroke-width="1" text-anchor="middle">${escapeHtml(years.devfest)}</text>
    <text x="100" y="128" font-size="9" font-weight="700" fill="#fff" letter-spacing="3" text-anchor="middle">${escapeHtml(text.unit)}</text>
    <g clip-path="url(#sealClip)"><rect class="seal-shine" x="-70" y="-10" width="26" height="220" fill="#fff" opacity=".4"/></g>
  </svg>`;
}
