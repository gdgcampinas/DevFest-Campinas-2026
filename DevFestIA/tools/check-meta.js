/**
 * Confere a coerência dos metadados de compartilhamento (OG, Twitter,
 * canonical), do sitemap, do robots e da imagem. Roda no CI:
 *   node DevFestIA/tools/check-meta.js
 * As tags ficam estáticas em cada .html (robôs sociais não executam
 * JavaScript), então este script é a rede de segurança contra uma
 * página esquecida ou com URL errada.
 */
const fs = require("fs");
const path = require("path");

const docs = path.join(__dirname, "..", "..", "docs");
const pages = fs.readdirSync(docs).filter(name => name.endsWith(".html"));
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

if (errors.length) {
  console.error(errors.map(e => `FAIL: ${e}`).join("\n"));
  process.exit(1);
}
console.log(`OK: metadados de ${pages.length} páginas, sitemap, robots e imagem coerentes`);
