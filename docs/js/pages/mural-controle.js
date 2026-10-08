/**
 * Página: CONTROLE do mural (ferramenta interna, fora do nav/sitemap, sem versão /DEV/; abra no celular do moderador). Raiz de composição: só liga as peças (os parâmetros padrão do painel:
 * regras puras, repository do moderador, cenas que podem ser fixadas, frases prontas), sem regra de negócio. A mesma tela mora na área de admin (seção Telão).
 */
function initMuralControlePage() {
  mountAdminNav();
  initMuralControlPanel(document.getElementById("modBody"), defaultMuralControlPanelDeps());
}

runAfterModules(initMuralControlePage);
