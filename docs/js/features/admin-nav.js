/**
 * Feature: o menu da área de admin. `initAdminNav` desenha o menu num elemento e devolve `setCurrent(id)` (a seção em destaque muda sem refazer a página); `mountAdminNav` é o atalho das telas de
 * moderação que só têm o menu por cima: lê a seção em destaque do `data-admin-current` do próprio elemento e aponta os links pra página do admin. Tudo por parâmetro (`sections`, `base`).
 */
function initAdminNav(navEl, { sections, base = "", current = "" }) {
  const draw = id => { navEl.innerHTML = adminNavMarkup({ sections, current: id, base }); };
  draw(current);
  return { setCurrent: draw };
}

function mountAdminNav(navEl = document.getElementById("adminNav"), { sections = adminSectionsRepository.getAll(), base = adminSectionsRepository.page } = {}) {
  if (!navEl) return null;
  return initAdminNav(navEl, { sections, base, current: navEl.dataset.adminCurrent ?? "" });
}
