/**
 * Página: ÁREA DE ADMIN (admin.html), a central de controle da equipe (ferramenta interna, fora do nav/sitemap, sem versão /DEV/; pensada pro celular do moderador). Raiz de composição: só liga as peças
 * (sessão, rotas, menu e a tela de cada seção), sem regra de negócio. `?lineup=1` e `?demo=` valem como em qualquer página.
 */
function initAdminPage() {
  const sections = adminSectionsRepository.getAll();
  initAdminShell(document.getElementById("adminBody"), {
    session: createAdminSession(),
    router: createHashRouter({ routes: sections.map(section => section.id), fallback: sections[0].id }),
    navEl: document.getElementById("adminNav"),
    sections,
    mounts: {
      atalhos: containerEl => initAdminShortcuts(containerEl, { shortcuts: adminShortcutsRepository.getAll() }),
    },
  });
}

runAfterModules(initAdminPage);
