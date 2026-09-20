/**
 * Testa a instalação do app sem navegador: detecção de plataforma por user
 * agent, cobertura dos guias, dependências de scripts em toda página que
 * carrega pwa.js (foi a falta delas na página de Patrocínio que passou
 * despercebida) e os ícones "any" e "maskable" do manifesto. Roda no CI.
 *   node DevFestIA/tools/check-install.js
 */
const fs = require("fs"), vm = require("vm"), path = require("path");
const docs = path.join(__dirname, "..", "..", "docs");
const read = file => fs.readFileSync(path.join(docs, file), "utf8");
let fails = 0;
const fail = message => { fails++; console.log("FAIL:", message); };

const ctx = vm.createContext({ console });
const files = ["js/data/repository.js", "js/data/install-guides.js", "js/features/install-platform.js"];
vm.runInContext(files.map(read).join("\n;\n") + "\n;globalThis.__o={INSTALL_GUIDES,INSTALL_PLATFORM_RULES,installGuidesRepository,detectInstallPlatform};", ctx);
const o = ctx.__o;

const UAS = {
  "ios-safari": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "ios-other": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0 Mobile/15E148 Safari/604.1",
  "in-app": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0",
  "android-chromium": "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Mobile Safari/537.36",
  "android-firefox": "Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0 Firefox/124.0",
  "desktop-chromium": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
  "desktop-safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "desktop-firefox": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0",
};
for (const [expected, ua] of Object.entries(UAS)) {
  const got = o.detectInstallPlatform({ ua, maxTouchPoints: 0 });
  if (got !== expected) fail(`user agent de ${expected} foi detectado como ${got}`);
}
const ipadAsMac = o.detectInstallPlatform({ ua: UAS["desktop-safari"], maxTouchPoints: 5 });
if (ipadAsMac !== "ios-safari") fail(`iPad que se apresenta como Mac foi detectado como ${ipadAsMac}`);
if (o.detectInstallPlatform({ ua: "curl/8.0", maxTouchPoints: 0 }) !== "generic") fail("user agent desconhecido deveria ser generic");

// todo id de regra tem guia, todo guia tem título e passos, e o generic existe
o.INSTALL_PLATFORM_RULES.forEach(rule => { if (o.installGuidesRepository.getByPlatform(rule.id).id !== rule.id) fail(`regra ${rule.id} sem guia`); });
o.INSTALL_GUIDES.forEach(guide => { if (!guide.title || !guide.steps.length) fail(`guia ${guide.id} sem título ou passos`); });
if (o.installGuidesRepository.getByPlatform("nao-existe").id !== "generic") fail("id desconhecido deveria cair no guia generic");

// dependências de scripts de toda página que carrega o pwa.js
const NEEDED = ["js/data/repository.js", "js/data/icons.js", "js/data/install-guides.js", "js/components/icon.js", "js/components/modal.js", "js/components/install-guide.js", "js/features/install-platform.js"];
fs.readdirSync(docs).filter(file => file.endsWith(".html")).forEach(page => {
  const html = read(page);
  if (!html.includes("js/features/pwa.js")) return;
  NEEDED.forEach(script => { if (!html.includes(`src="${script}`)) fail(`${page}: falta ${script}`); });
});

// manifesto: ícones "any" e "maskable" separados, nos dois tamanhos
const icons = JSON.parse(read("manifest.webmanifest")).icons || [];
for (const purpose of ["any", "maskable"]) {
  for (const size of ["192x192", "512x512"]) {
    if (!icons.some(icon => icon.sizes === size && icon.purpose === purpose)) fail(`manifesto sem ícone ${size} com purpose ${purpose}`);
  }
}

console.log(fails ? `${fails} falha(s)` : "instalação ok");
process.exit(fails ? 1 : 0);
