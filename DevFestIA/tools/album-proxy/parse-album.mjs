/**
 * Leitor da página de compartilhamento de um álbum do Google Fotos (função PURA, sem rede). A página traz os dados do álbum embutidos no HTML; cada foto é um
 * pequeno array no formato
 *   ["<id AF1Qip...>", ["https://lh3.googleusercontent.com/pw/<token>", largura, altura, ...], <horário da foto em ms>, "<chave>", <fuso>, <horário em que entrou no álbum em ms>, ...]
 * Em vez de depender do resto da página (que o Google muda), o leitor acha o começo de cada foto, fecha o array (respeitando textos entre aspas) e lê só ele com JSON.parse.
 * Leitura NÃO oficial: se o formato mudar, devolve { ok: false } em vez de uma lista errada, e quem chama segue com a última lista boa.
 *
 * Saída: { ok: true, title, photos: [{ id, url, width, height, takenAt, addedAt }] } (mais nova primeiro, sem repetidas), ou { ok: false, reason }.
 * `url` é a base: o tamanho se pede acrescentando `=w1920-h1080` (o site monta, ver docs/js/features/album-photo-url.js).
 */
const ITEM_START = /\["(AF1Qip[A-Za-z0-9_-]+)",\["https:\/\/lh3\.googleusercontent\.com\/pw\//g;

/** Texto do array que começa em `start`: anda até fechar o colchete, ignorando colchetes dentro de aspas. */
function sliceArray(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index++) {
    const char = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === "[") depth++;
    else if (char === "]" && --depth === 0) return text.slice(start, index + 1);
  }
  return null;
}

function toPhoto(item) {
  const meta = item?.[1];
  if (typeof item?.[0] !== "string" || typeof meta?.[0] !== "string") return null;
  const [id, [url, width, height]] = item;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { id, url, width, height, takenAt: Number.isFinite(item[2]) ? item[2] : null, addedAt: Number.isFinite(item[5]) ? item[5] : null };
}

const decodeEntities = text => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** "DevFest Campinas 2026 - Ao vivo · Saturday, Nov 29 📸" -> "DevFest Campinas 2026 - Ao vivo". */
export function albumTitle(html) {
  const raw = /property="og:title" content="([^"]*)"/.exec(html)?.[1] ?? /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
  return decodeEntities(raw).replace(/\s+-\s+Google (Photos|Fotos)$/, "").split(" · ")[0].trim();
}

export function parseAlbumPage(html) {
  if (typeof html !== "string" || html.length < 1000) return { ok: false, reason: "página vazia ou curta demais" };
  const byId = new Map();
  for (const match of html.matchAll(ITEM_START)) {
    const raw = sliceArray(html, match.index);
    if (!raw) continue;
    let photo = null;
    try {
      photo = toPhoto(JSON.parse(raw));
    } catch {
      /* item que não é JSON puro: ignora só ele */
    }
    if (photo && !byId.has(photo.id)) byId.set(photo.id, photo);
  }
  if (!byId.size) return { ok: false, reason: "nenhuma foto encontrada (o formato da página mudou?)" };
  const photos = [...byId.values()].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
  return { ok: true, title: albumTitle(html), photos };
}
