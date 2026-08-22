/**
 * Gera imagem placeholder inline (SVG data URI, sem dependência
 * externa) — único lugar que sabe fazer isso. Usado por qualquer
 * dado mock (sponsors, comunidades parceiras, highlights) até a
 * imagem real chegar. Precisa carregar antes dos outros arquivos de
 * data/ que o chamam.
 */
function placeholderImage(label, width = 160, height = 60) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='${width}' height='${height}' fill='%23222831'/><text x='50%25' y='50%25' fill='%23999' font-family='sans-serif' font-size='14' text-anchor='middle' dy='.3em'>${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${svg}`;
}
