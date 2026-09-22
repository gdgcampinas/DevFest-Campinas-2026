/**
 * Loader reusado por toda página /DEV/*.html — cada uma só passa
 * `data-target` (o arquivo real, ex. "grade.html") no próprio
 * <script>, essa função faz o resto: grava a mesma chave que
 * ?lineup=1 grava (DEV_MODE_KEY em ../js/app.js), busca a página real
 * e reescreve o documento com ela (base href="../" resolve todo
 * caminho relativo de css/js/assets pro lugar certo). A URL na barra
 * de endereço continua em /DEV/<página>, nunca pula pra fora. Zero
 * duplicação: o conteúdo vem sempre da página real, nunca uma cópia —
 * se ela mudar, o DEV muda junto, sem tocar aqui nem nos wrappers.
 *
 * Com `<base href="../">`, todo link relativo pra outra página (nav,
 * teasers, rodapé, e links que aparecem depois — modal de palestra
 * levando pro perfil, "Voltar" etc.) resolveria pro site normal, saindo
 * do /DEV/ ao primeiro clique. patchLink() prefixa "DEV/" em qualquer
 * link pra `<algo>.html` (rota do site), então navegar por dentro do
 * DEV continua em DEV — um MutationObserver cobre link novo inserido
 * depois (modal, banners), não só o que já existe na carga da página.
 */
(function () {
  var target = document.currentScript.dataset.target;
  try {
    sessionStorage.setItem("devfest-campinas-2026:dev-mode", "1");
  } catch {
    /* sem sessionStorage: segue mesmo assim, só não persiste entre páginas */
  }

  function patchLink(a) {
    var href = a.getAttribute("href");
    if (!href || a.dataset.devPatched) return;
    if (/^(https?:|mailto:|tel:|#|DEV\/)/i.test(href)) return; // externo, âncora pura ou já corrigido
    if (!/\.html(#|\?|$)/.test(href)) return; // só rota de página (.html), não css/js/assets/imagem
    a.setAttribute("href", "DEV/" + href);
    a.dataset.devPatched = "1";
  }

  function patchAllLinks(root) {
    root.querySelectorAll("a[href]").forEach(patchLink);
  }

  fetch("../" + target)
    .then(function (response) { return response.text(); })
    .then(function (html) {
      document.open();
      document.write(html.replace("<head>", '<head><base href="../">'));
      document.close();
      patchAllLinks(document);
      new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.matches && node.matches("a[href]")) patchLink(node);
            if (node.querySelectorAll) patchAllLinks(node);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    })
    .catch(function () { location.replace("../" + target); }); // sem fetch (offline/CORS): cai pro redirect simples
})();
