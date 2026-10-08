/**
 * Feature: o casco da área de admin. Liga a sessão (login único), o menu e as rotas por hash: sem login mostra só a porta de entrada; com login desenha a conta, o título e a SEÇÃO da rota.
 * Cada seção é uma função `mounts[id](containerEl, { email })` que devolve `{ stop }`: o casco cria um contêiner NOVO a cada visita e chama o `stop` da seção anterior ao sair (nenhuma escuta do
 * Firestore fica aberta fora da seção que está na tela). Seção sem tela montada ou que dá erro ao abrir vira um aviso no lugar: uma seção quebrada nunca derruba as outras.
 * Começa restaurando o login que já existe; enquanto isso a página mostra "Carregando…". Tudo por parâmetro: `session` (features/admin-session.js), `router` (features/hash-router.js), `navEl` (o menu, features/admin-nav.js), `sections` (data/admin-sections.js), `mounts`, `doc`.
 */
function initAdminShell(rootEl, { session, router, navEl, sections, mounts, doc = document }) {
  let nav = null;
  let mounted = { stop: () => {} };
  let gateMessage = "";

  const stopSection = () => {
    mounted.stop();
    mounted = { stop: () => {} };
  };

  function openSection(id) {
    stopSection();
    nav.setCurrent(id);
    rootEl.querySelector("[data-admin-title]").textContent = sections.find(section => section.id === id)?.title ?? "";
    const container = doc.createElement("div");
    rootEl.querySelector("[data-admin-view]").replaceChildren(container);
    if (!mounts[id]) {
      container.innerHTML = adminSectionNoticeMarkup("Esta seção ainda não está disponível.");
      return;
    }
    try {
      mounted = mounts[id](container, { email: session.email() }) ?? mounted;
    } catch (error) {
      console.warn(`[admin] a seção ${id} não abriu:`, error);
      container.innerHTML = adminSectionNoticeMarkup("Não consegui abrir esta seção. Recarregue a página.");
    }
  }

  function draw() {
    stopSection();
    if (!session.email()) {
      navEl.hidden = true;
      rootEl.innerHTML = adminSignInGateMarkup({ message: gateMessage });
      return;
    }
    gateMessage = "";
    navEl.hidden = false;
    rootEl.innerHTML = adminShellMarkup({ email: session.email() });
    nav = initAdminNav(navEl, { sections, base: "", current: router.current() });
    openSection(router.current());
  }

  rootEl.addEventListener("click", async event => {
    if (event.target.closest("[data-mod-signin]")) {
      try {
        await session.signIn();
      } catch (error) {
        gateMessage = signInErrorMessage(error);
        draw();
      }
    } else if (event.target.closest("[data-mod-signout]")) {
      await session.signOut();
    }
  });

  const stopSession = session.onChange(draw);
  const stopRouter = router.listen(id => { if (session.email()) openSection(id); });
  session.restore(); // quem já tinha entrado em outra tela de moderação volta logado sem pedir de novo; o resultado (logado ou não) desenha a tela pelo `onChange`

  return {
    stop() {
      stopSection();
      stopSession();
      stopRouter();
    },
  };
}
