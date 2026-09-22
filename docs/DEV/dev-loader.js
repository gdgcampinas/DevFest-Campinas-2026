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
 */
(function () {
  var target = document.currentScript.dataset.target;
  try {
    localStorage.setItem("devfest-campinas-2026:dev-mode", "1");
  } catch {
    /* sem localStorage: segue mesmo assim, só não persiste entre páginas */
  }
  fetch("../" + target)
    .then(function (response) { return response.text(); })
    .then(function (html) {
      document.open();
      document.write(html.replace("<head>", '<head><base href="../">'));
      document.close();
    })
    .catch(function () { location.replace("../" + target); }); // sem fetch (offline/CORS): cai pro redirect simples
})();
