/**
 * Service worker: deixa o site funcionar sem internet (Wi-Fi de evento
 * costuma falhar). Estratégia, sem lista de arquivos escrita à mão:
 *   instalação  → baixa as páginas do SITE_PAGES e tudo que elas
 *                 referenciam (scripts, estilos, fontes, ícones) e o que
 *                 os estilos referenciam (imagens de fundo)
 *   páginas     → rede primeiro (sempre a versão mais nova), cache se offline
 *   arquivos com ?v=N ou em /assets/ → cache primeiro (a URL muda quando o
 *                 arquivo muda, então nunca fica velho)
 *   demais      → rede primeiro, cache se offline
 * Só trata a mesma origem. Trocar SW_VERSION descarta o cache antigo.
 * Botão de emergência: abrir qualquer página com ?nosw=1 (ver pwa.js).
 */
importScripts("js/components/site-nav.js"); // define SITE_PAGES (única lista de páginas)

const SW_VERSION = "1";
const CACHE_NAME = `devfest-shell-v${SW_VERSION}`;
const EXTRA_FILES = ["manifest.webmanifest"];

const isSameOrigin = url => url.origin === self.location.origin;
const isVersionedAsset = url => url.searchParams.has("v") || url.pathname.includes("/assets/");

/** Chave de cache de uma página: só o caminho ("/" vira index.html), pra ?demo= e ?agenda= reaproveitarem a mesma cópia. */
function pageKey(url) {
  const path = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
  return new Request(new URL(path, url.origin).href);
}

/**
 * Arquivos da mesma origem referenciados no HTML por src/href, inclusive os
 * escritos dentro do onerror do schedule (é assim que a produção carrega o
 * schedule.js quando o schedule.dev.js não existe). Links pra outras páginas,
 * âncoras e endereços externos ficam de fora.
 */
function assetUrlsFromHtml(html, baseUrl) {
  const urls = new Set();
  for (const match of html.matchAll(/\b(?:src|href)=(?:"|&quot;)([^"&\s]+)/g)) {
    const url = new URL(match[1], baseUrl);
    if (isSameOrigin(url) && !url.pathname.endsWith(".html") && !url.pathname.endsWith("/")) urls.add(url.href);
  }
  return [...urls];
}

/** Imagens e fontes citadas em url(...) dentro de um CSS. */
function assetUrlsFromCss(css, cssUrl) {
  const urls = new Set();
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (match[1].startsWith("data:")) continue;
    const url = new URL(match[1], cssUrl);
    if (isSameOrigin(url)) urls.add(url.href);
  }
  return [...urls];
}

async function fetchFresh(url) {
  const response = await fetch(new Request(url, { cache: "reload" }));
  return response.ok ? response : null;
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  const assets = new Set(EXTRA_FILES.map(file => new URL(file, self.registration.scope).href));

  await Promise.all(SITE_PAGES.map(async page => {
    const pageUrl = new URL(page.href, self.registration.scope);
    const response = await fetchFresh(pageUrl.href);
    if (!response) return;
    await cache.put(pageKey(pageUrl), response.clone());
    assetUrlsFromHtml(await response.text(), pageUrl.href).forEach(url => assets.add(url));
  }));

  const styles = [...assets].filter(url => new URL(url).pathname.endsWith(".css"));
  for (const cssUrl of styles) {
    const response = await fetchFresh(cssUrl);
    if (response) assetUrlsFromCss(await response.text(), cssUrl).forEach(url => assets.add(url));
  }

  const manifestUrl = new URL("manifest.webmanifest", self.registration.scope).href;
  const manifestResponse = await fetchFresh(manifestUrl).catch(() => null);
  if (manifestResponse) {
    const manifest = await manifestResponse.json();
    (manifest.icons || []).forEach(icon => assets.add(new URL(icon.src, manifestUrl).href));
  }

  // arquivo que falhar (ex.: schedule.dev.js, que só existe local) não derruba a instalação
  await Promise.all([...assets].map(async url => {
    const response = await fetchFresh(url).catch(() => null);
    if (response) await cache.put(url, response);
  }));
}

async function networkFirst(request, key = request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(key, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(key);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function pageOffline(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);
  return (await cache.match(pageKey(url))) || (await cache.match(pageKey(new URL("index.html", self.registration.scope))));
}

self.addEventListener("install", event => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name.startsWith("devfest-shell-") && name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || !isSameOrigin(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, pageKey(url)).catch(() => pageOffline(request)));
  } else if (isVersionedAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});
