/**
 * Página: ÁREA DE ADMIN (admin.html), a central de controle da equipe (ferramenta interna, fora do nav/sitemap, sem versão /DEV/; pensada pro celular do moderador). Raiz de composição: só liga as peças
 * (sessão, rotas, menu e a tela de cada seção), sem regra de negócio. `?lineup=1` e `?demo=` valem como em qualquer página.
 */
function initAdminPage() {
  const sections = adminSectionsRepository.getAll();
  const muralConfig = muralConfigRepository.getAll();
  const liveAlbum = muralAlbumsRepository.enabled({ live: true })[0] ?? null; // o álbum onde o público do evento adiciona fotos: o que o moderador vigia
  const albumsRepository = muralConfig.albums.proxyUrl ? createModerationAlbumsRepository({ proxyUrl: muralConfig.albums.proxyUrl, timeoutMs: muralConfig.albums.timeoutMs }) : null;
  const session = createAdminSession();
  const resolveAccess = async () => {
    const access = await resolveAdminAccess({ probe: () => window.moderationModeratorsRepository.probe(), probeModerator: () => window.moderatorAccessRepository.probe() });
    recordModeratorSeen({ access, email: session.email(), repository: window.moderationModeratorSeenRepository }); // sem esperar: registrar nunca atrasa a entrada
    return access;
  };
  initAdminShell(document.getElementById("adminBody"), {
    session,
    router: createHashRouter({ routes: sections.map(section => section.id), fallback: sections[0].id }),
    navEl: document.getElementById("adminNav"),
    sections,
    brand: adminBrandRepository.getAll(),
    access: { resolve: resolveAccess },
    mounts: {
      "visao-geral": containerEl => initAdminOverview(containerEl, { cards: buildAdminOverviewCards({ definitions: adminOverviewRepository.getAll(), deps: defaultAdminOverviewDeps({ album: liveAlbum, albumsRepository }) }) }),
      telao: containerEl => initMuralControlPanel(containerEl, { ...defaultMuralControlPanelDeps(), embedded: true }),
      fotos: containerEl => mountMuralPhotoModeration(containerEl, { album: liveAlbum, proxyUrl: muralConfig.albums.proxyUrl, albumIds: muralAlbumsRepository.getAll().map(album => album.id), timeoutMs: muralConfig.albums.timeoutMs, embedded: true }),
      palestras: containerEl => initAdminTalksSection(containerEl, { ...defaultAdminTalksDeps(), links: adminTrackLinksRepository.getAll(), refreshMs: adminTalksConfigRepository.getAll().refreshMs }),
      recados: containerEl => initAdminWall(containerEl, { repository: window.moderationWallRepository, rules: { groupWallPosts, wallStatusFor }, config: wallConfigRepository.getAll(), text: adminWallRepository.getAll(), formatTime: ms => formatEventTime(new Date(ms), EVENT.timezone) }),
      "lista-de-espera": containerEl => initAdminWaitlist(containerEl, defaultAdminWaitlistDeps()),
      moderadores: (containerEl, { email }) => {
        const invite = defaultModeratorInvite(email); // convite e "quem já entrou" são liberados juntos (data/admin-sections.js)
        return initAdminModerators(containerEl, { repository: window.moderationModeratorsRepository, rules: { buildModeratorToAdd, sortModerators }, config: adminModeratorsRepository.getAll(), selfEmail: email, invite, seenRepository: invite ? window.moderationModeratorSeenRepository : null });
      },
      "antes-do-evento": containerEl => initAdminBeforeEvent(containerEl, { config: adminBeforeEventRepository.getAll(), reset: () => resetBrowserData(), resultRows: localResetRows }),
      atalhos: containerEl => initAdminShortcuts(containerEl, { shortcuts: adminShortcutsRepository.getAll() }),
    },
  });
}

runAfterModules(initAdminPage);
