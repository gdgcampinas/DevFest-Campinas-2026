/**
 * Confere a coerência dos metadados de compartilhamento (OG, Twitter,
 * canonical), do sitemap, do robots, da imagem e da PWA (manifesto, ícones, sw.js). Roda no CI:
 *   node DevFestIA/tools/check-meta.js
 * As tags ficam estáticas em cada .html (robôs sociais não executam
 * JavaScript), então este script é a rede de segurança contra uma
 * página esquecida ou com URL errada.
 */
const fs = require("fs");
const path = require("path");

const docs = path.join(__dirname, "..", "..", "docs");
// Páginas de ferramenta interna (não indexadas, sem link em lugar nenhum,
// só quem tem a URL direta acessa) ficam fora de sitemap/OG/PWA — não são
// conteúdo do site, são utilitário pra organização durante o evento.
const INTERNAL_PAGES = ["checkin-display.html", "reset-teste.html"];
const pages = fs.readdirSync(docs).filter(name => name.endsWith(".html") && !INTERNAL_PAGES.includes(name));
const errors = [];
const fail = message => errors.push(message);

const schedule = fs.readFileSync(path.join(docs, "js/data/schedule.js"), "utf8");
const baseUrl = (schedule.match(/^\s*url: "([^"]+)"/m) || [])[1];
const imagePath = (schedule.match(/^\s*image: "([^"]+)"/m) || [])[1];
if (!baseUrl || !imagePath) fail("EVENT.url / EVENT.image não encontrados em schedule.js");

const metaContent = (html, attr, key) => {
  const match = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)">`));
  return match ? match[1] : null;
};

pages.forEach(file => {
  const html = fs.readFileSync(path.join(docs, file), "utf8");
  const expectedUrl = file === "index.html" ? baseUrl : baseUrl + file;
  const title = (html.match(/<title>(.*?)<\/title>/) || [])[1];

  const required = {
    "og:title": metaContent(html, "property", "og:title"),
    "og:description": metaContent(html, "property", "og:description"),
    "og:url": metaContent(html, "property", "og:url"),
    "og:image": metaContent(html, "property", "og:image"),
    "twitter:card": metaContent(html, "name", "twitter:card"),
    "twitter:image": metaContent(html, "name", "twitter:image"),
    description: metaContent(html, "name", "description"),
  };
  Object.entries(required).forEach(([key, value]) => { if (!value) fail(`${file}: falta ${key}`); });

  if (required["og:title"] !== title) fail(`${file}: og:title difere do <title>`);
  if (required["og:description"] !== required.description) fail(`${file}: og:description difere da description`);
  if (required["og:url"] !== expectedUrl) fail(`${file}: og:url deveria ser ${expectedUrl}`);
  if (!html.includes(`<link rel="canonical" href="${expectedUrl}">`)) fail(`${file}: canonical incorreto`);
  if (required["og:image"] !== baseUrl + imagePath) fail(`${file}: og:image deveria ser ${baseUrl + imagePath}`);
  if (required["twitter:image"] !== required["og:image"]) fail(`${file}: twitter:image difere de og:image`);
});

if (imagePath && !fs.existsSync(path.join(docs, imagePath))) fail(`imagem ${imagePath} não existe`);

const sitemap = fs.existsSync(path.join(docs, "sitemap.xml")) ? fs.readFileSync(path.join(docs, "sitemap.xml"), "utf8") : "";
pages.forEach(file => {
  const url = file === "index.html" ? baseUrl : baseUrl + file;
  if (!sitemap.includes(`<loc>${url}</loc>`)) fail(`sitemap.xml não lista ${url}`);
});
const robots = fs.existsSync(path.join(docs, "robots.txt")) ? fs.readFileSync(path.join(docs, "robots.txt"), "utf8") : "";
if (!robots.includes(`Sitemap: ${baseUrl}sitemap.xml`)) fail("robots.txt sem a linha Sitemap");

// PWA: manifesto linkado em toda página, ícones existentes, service worker presente
const manifestPath = path.join(docs, "manifest.webmanifest");
if (!fs.existsSync(manifestPath)) {
  fail("manifest.webmanifest não existe");
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest.name || !manifest.start_url) fail("manifesto sem name/start_url");
  if (!fs.existsSync(path.join(docs, manifest.start_url))) fail(`start_url ${manifest.start_url} não existe`);
  (manifest.icons || []).forEach(icon => { if (!fs.existsSync(path.join(docs, icon.src))) fail(`ícone ${icon.src} não existe`); });
  if (!(manifest.icons || []).some(icon => icon.sizes === "192x192") || !(manifest.icons || []).some(icon => icon.sizes === "512x512")) fail("manifesto precisa de ícones 192x192 e 512x512");
}
if (!fs.existsSync(path.join(docs, "sw.js"))) fail("sw.js não existe");
pages.forEach(file => {
  if (!fs.readFileSync(path.join(docs, file), "utf8").includes('<link rel="manifest" href="manifest.webmanifest">')) fail(`${file}: falta o link do manifesto`);
});

if (errors.length) {
  console.error(errors.map(e => `FAIL: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`OK: metadados de ${pages.length} páginas, sitemap, robots, imagem e PWA coerentes`);
