/**
 * Gerador de avatar MOCK (SVG inline, sem rosto real e sem dependência
 * externa). Determinístico: o mesmo `seed` sempre gera a mesma pessoa,
 * e seeds diferentes variam tom de pele, cabelo, acessórios, camisa e
 * fundo. Único lugar que sabe desenhar isso; quando o line-up real
 * chegar, `speaker.photo` passa a ser a foto de verdade e este arquivo
 * deixa de ser usado. Precisa carregar antes de mock-speakers.js.
 * As cores de fundo repetem a paleta da marca (tokens.css): data URI
 * de imagem não enxerga variável CSS, então ficam como hex aqui.
 */
const AVATAR_SKINS = ["#f6d5bd", "#e8b98d", "#d39b6a", "#b57a4b", "#8d5a3a", "#6b4029", "#4f2e1f", "#f0c8a0"];
const AVATAR_HAIRS = ["#1c1a1a", "#3b2a20", "#6b4a2f", "#a1724a", "#c9a25a", "#8c8c94", "#7a2e2e"];
const AVATAR_BACKGROUNDS = ["#4285f4", "#ea4335", "#fbbc04", "#34a853"];
const AVATAR_SHIRTS = ["#1f2937", "#f3f4f6", "#374151", "#0f766e", "#7c3aed", "#be185d"];
const AVATAR_HAIR_STYLES = ["short", "long", "bun", "curly", "bald", "afro", "side"];
const AVATAR_INK = "#23201f";

/** Cabelo atrás da cabeça (long, afro, bun) — desenhado antes do rosto. */
const AVATAR_HAIR_BACK = {
  long: hair => `<path d="M38 52 Q38 22 60 22 Q82 22 82 52 L84 94 Q60 102 36 94Z" fill="${hair}"/>`,
  afro: hair => `<circle cx="60" cy="46" r="31" fill="${hair}"/>`,
  bun: hair => `<circle cx="60" cy="24" r="9" fill="${hair}"/>`,
};

/** Cabelo à frente do rosto — desenhado depois. */
const AVATAR_HAIR_FRONT = {
  short: hair => `<path d="M40 54 Q38 30 60 30 Q82 30 80 54 Q74 42 60 42 Q46 42 40 54Z" fill="${hair}"/>`,
  long: hair => `<path d="M40 54 Q38 30 60 30 Q82 30 80 54 Q74 42 60 42 Q46 42 40 54Z" fill="${hair}"/>`,
  bun: hair => `<path d="M40 54 Q38 30 60 30 Q82 30 80 54 Q74 42 60 42 Q46 42 40 54Z" fill="${hair}"/>`,
  afro: hair => `<path d="M40 52 Q40 32 60 32 Q80 32 80 52 Q72 42 60 42 Q48 42 40 52Z" fill="${hair}"/>`,
  curly: hair => [[44, 38, 9], [60, 32, 10], [76, 38, 9], [38, 50, 6], [82, 50, 6]]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}"/>`).join(""),
  side: hair => `<path d="M40 54 Q38 30 62 30 Q84 30 80 50 Q66 38 46 46Z" fill="${hair}"/>`,
  bald: () => "",
};

/** Escolhe um item da lista de forma determinística e espalhada (multiplicador coprimo com o tamanho). */
function avatarPick(list, seed, multiplier, offset = 0) {
  return list[(seed * multiplier + offset) % list.length];
}

function mockAvatar(seed) {
  const skin = avatarPick(AVATAR_SKINS, seed, 3, 1);
  const hair = avatarPick(AVATAR_HAIRS, seed, 5, 2);
  const style = avatarPick(AVATAR_HAIR_STYLES, seed, 5, 3);
  const background = avatarPick(AVATAR_BACKGROUNDS, seed, 1);
  const shirt = avatarPick(AVATAR_SHIRTS, seed, 7, 1);
  const glasses = seed % 5 === 2;
  const beard = style === "short" && seed % 3 === 0;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
<rect width="120" height="120" fill="${background}"/>
${AVATAR_HAIR_BACK[style]?.(hair) ?? ""}
<path d="M14 120 Q16 90 60 88 Q104 90 106 120Z" fill="${shirt}"/>
<rect x="52" y="70" width="16" height="22" rx="6" fill="${skin}"/><rect x="52" y="70" width="16" height="22" rx="6" fill="#000" opacity=".12"/>
<circle cx="40" cy="58" r="4" fill="${skin}"/><circle cx="80" cy="58" r="4" fill="${skin}"/>
<ellipse cx="60" cy="56" rx="20" ry="23" fill="${skin}"/>
${beard ? `<path d="M42 64 Q42 86 60 86 Q78 86 78 64 Q72 72 60 72 Q48 72 42 64Z" fill="${hair}"/>` : ""}
${AVATAR_HAIR_FRONT[style](hair)}
<circle cx="52" cy="58" r="2.2" fill="${AVATAR_INK}"/><circle cx="68" cy="58" r="2.2" fill="${AVATAR_INK}"/>
<path d="M53 67 Q60 73 67 67" stroke="${beard ? skin : AVATAR_INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
${glasses ? `<g fill="none" stroke="${AVATAR_INK}" stroke-width="1.8"><circle cx="52" cy="58" r="6.5"/><circle cx="68" cy="58" r="6.5"/><path d="M58.5 58H61.5"/></g>` : ""}
</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
