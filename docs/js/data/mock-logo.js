/**
 * Logo MOCK de empresa/comunidade (SVG inline): símbolo geométrico na
 * cor da "marca" + nome ao lado, pra parecer um logo de verdade nas
 * caixas brancas de patrocinador. Único lugar que sabe desenhar isso;
 * troca por imagem real quando o patrocinador for confirmado.
 * Precisa carregar antes de sponsors.js e partner-communities.js.
 */
const MOCK_LOGO_SHAPES = {
  circle: color => `<circle cx="24" cy="40" r="19" fill="${color}"/>`,
  square: color => `<rect x="5" y="21" width="38" height="38" rx="8" fill="${color}"/>`,
  triangle: color => `<path d="M24 20 L44 58 H4Z" fill="${color}"/>`,
  hex: color => `<path d="M24 19 L42 29.5 V50.5 L24 61 L6 50.5 V29.5Z" fill="${color}"/>`,
  ring: color => `<circle cx="24" cy="40" r="15" fill="none" stroke="${color}" stroke-width="8"/>`,
  bars: color => `<g fill="${color}"><rect x="4" y="44" width="10" height="16" rx="3"/><rect x="19" y="32" width="10" height="28" rx="3"/><rect x="34" y="20" width="10" height="40" rx="3"/></g>`,
};

const MOCK_LOGO_INK = "#1f2937";
const MOCK_LOGO_HEIGHT = 56;
const MOCK_LOGO_FONT_SIZE = 26;
const MOCK_LOGO_CHAR_WIDTH = 0.6; // largura média de um caractere, em fração do corpo da fonte

/** `shape` é uma chave de MOCK_LOGO_SHAPES; `color` é o hex da marca fictícia. A largura acompanha o nome. */
function mockLogo({ name, shape = "circle", color = "#4285f4" }) {
  const width = Math.ceil(56 + name.length * MOCK_LOGO_FONT_SIZE * MOCK_LOGO_CHAR_WIDTH + 8);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${MOCK_LOGO_HEIGHT}" width="${width}" height="${MOCK_LOGO_HEIGHT}">
<g transform="translate(0,-12)">${MOCK_LOGO_SHAPES[shape](color)}</g>
<text x="56" y="28" dy=".35em" font-family="Arial, Helvetica, sans-serif" font-size="${MOCK_LOGO_FONT_SIZE}" font-weight="700" fill="${MOCK_LOGO_INK}">${name}</text>
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
