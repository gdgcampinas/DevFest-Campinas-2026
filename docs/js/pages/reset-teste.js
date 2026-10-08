/**
 * Página interna: limpar os dados locais deste navegador (ferramenta de
 * teste, fora do nav/sitemap, noindex). Só mexe nos dados de quem abre.
 */
initLocalReset(document.getElementById("rtScreen"), {
  resultMarkupFn: localResetResultMarkup,
  reset: () => resetBrowserData(),
});
