/**
 * Página interna: limpar os dados locais deste navegador (ferramenta de
 * teste, fora do nav/sitemap, noindex). Só mexe nos dados de quem abre.
 */
initLocalReset(document.getElementById("rtScreen"), {
  resultMarkupFn: localResetResultMarkup,
  reset: () => resetLocalData({
    prefix: "devfest-campinas-2026:",
    localStorage: window.localStorage,
    sessionStorage: window.sessionStorage,
    indexedDB: window.indexedDB,
    caches: window.caches,
    serviceWorker: navigator.serviceWorker,
  }),
});
