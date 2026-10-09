/**
 * Feature: o casco da área de admin. Liga a sessão (login único), o menu e as rotas por hash: sem login mostra só a porta de entrada; com login descobre o que a conta pode usar
 * (features/admin-access.js: o menu esconde o que só o dono usa), desenha a barra da conta e a SEÇÃO da rota. Cada seção é uma função `mounts[id](containerEl, { email })` que devolve `{ stop }`:
 * o casco cria um contêiner NOVO a cada visita e chama o `stop` da seção anterior ao sair (nenhuma escuta do Firestore fica aberta fora da seção que está na tela). Seção sem tela montada ou que dá
 * erro ao abrir vira um aviso no lugar: uma seção quebrada nunca derruba as outras. Rota de seção escondida cai na primeira visível.
 * Começa restaurando o login que já existe; enquanto isso a página mostra "Carregando…". Tudo por parâmetro: `session` (features/admin-session.js), `router` (features/hash-router.js), `navEl` (o menu,
 * features/admin-nav.js), `sections` (data/admin-sections.js), `brand` (ADMIN_BRAND), `mounts`, `access` ({ resolve() -> { owner } }, padrão: ninguém escondido), `doc`.
 */
function initAdminShell(rootEl, { session, router, navEl, sections, brand, mounts, access = { resolve: async () => ({ owner: null }) }, doc = document }) {
  let nav = null;
  let visible = sections;
  let openedId = null;
  let mounted = { stop: () => {} };
  let gateMessage = "";
  let drawing = 0;

  const stopSection = () => {
    mounted.stop();
    mounted = { stop: () => {} };
    openedId = null;
  };

  const allowedRoute = id => (visible.some(section => section.id === id) ? id : visible[0].id);

  function openSection(requestedId) {
    const id = allowedRoute(requestedId);
    if (id === openedId) return;
    stopSection();
    openedId = id;
    nav.setCurrent(id);
    if (id !== requestedId) router.go(id);
    const section = visible.find(item => item.id === id);
    rootEl.querySelector("[data-admin-title]").textContent = section.title;
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

  async function draw() {
    const turn = ++drawing;
    stopSection();
    if (!session.email()) {
      navEl.hidden = true;
      rootEl.innerHTML = adminSignInGateMarkup({ brand, message: gateMessage });
      return;
    }
    gateMessage = "";
    const granted = await access.resolve();
    if (turn !== drawing) return; // saiu ou trocou de conta enquanto descobria
    visible = visibleSections(sections, granted);
    navEl.hidden = false;
    rootEl.innerHTML = adminShellMarkup({ brand, email: session.email() });
    nav = initAdminNav(navEl, { sections: visible, base: "", current: allowedRoute(router.current()) });
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
  const stopRouter = router.listen(id => { if (session.email() && nav) openSection(id); });
  session.restore(); // quem já tinha entrado em outra tela de moderação volta logado sem pedir de novo; o resultado (logado ou não) desenha a tela pelo `onChange`

  return {
    stop() {
      drawing++;
      stopSection();
      stopSession();
      stopRouter();
    },
  };
}
