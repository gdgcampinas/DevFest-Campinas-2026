/**
 * Nav do site — 1 fonte só pras páginas (Principal/Grade/Palestrantes/
 * Time/Patrocínio/Código de Conduta). Cada página só chama
 * renderSiteNav(seu-id, mountEl, { reveal }); trocar um link ou adicionar
 * página nova é editar só aqui, nunca precisa tocar HTML de cada página.
 * `nav: false` = página que existe (pré-cache offline, activeId) mas não
 * aparece no menu; a home linka pra ela num CTA (ex.: o quiz).
 * `devOnly: true` = só aparece no menu com `reveal` true (`?lineup=1`/modo
 * DEV): página nova ainda em construção, sem exposição pro público (a
 * própria página também se protege com renderOrConstruction, ver
 * pages/sorteio.js — o menu é só a primeira camada).
 */
const SITE_PAGES = [
  { id: "principal", label: "Principal", href: "index.html" },
  { id: "grade", label: "Grade", href: "grade.html" },
  { id: "palestrantes", label: "Palestrantes", href: "palestrantes.html" },
  { id: "ingressos", label: "Ingressos", href: "ingressos.html" },
  { id: "local", label: "Como chegar", href: "local.html" }, // sem `devOnly` enquanto o mapa for público (data/venue-map.js; testado em venue-campus-map.dom.test.js)
  { id: "time", label: "Time", href: "time.html" },
  { id: "patrocinio", label: "Patrocínio", href: "patrocinio.html" },
  { id: "sorteio", label: "Sorteio", href: "sorteio.html", devOnly: true },
  { id: "recados", label: "Recados no telão", href: "recado.html" },
  { id: "fundos", label: "Fundos de tela", href: "fundos.html" },
  { id: "cod", label: "Código de Conduta", href: "codigo-de-conduta.html" },
  { id: "quiz", label: "Monte sua trilha", href: "quiz.html", nav: false },
];

/**
 * A ordem do menu pela jornada de quem visita: entender o evento, comprar e chegar, participar, e por último as páginas institucionais. Nasceu com `public: false` (só no modo DEV, `reveal`, pra conferir) e foi liberada em 2026-10-30 (`public: true`, vale pra todo mundo); `false` volta a segurar.
 * Página que não está na lista (ou ainda não existe) vai pro fim, na ordem de SITE_PAGES.
 */
const SITE_NAV_ORDER = {
  public: true,
  ids: ["principal", "grade", "palestrantes", "ingressos", "local", "sorteio", "recados", "fundos", "time", "patrocinio", "cod"],
};

/** Ordena `pages` pela lista `ids` (estável: o que não está na lista fica no fim, como veio). */
function sortPagesByOrder(pages, ids) {
  const rank = page => (ids.includes(page.id) ? ids.indexOf(page.id) : ids.length);
  return pages.map((page, index) => ({ page, index })).sort((a, b) => rank(a.page) - rank(b.page) || a.index - b.index).map(({ page }) => page);
}

function renderSiteNav(activeId, mountEl, { reveal = false, order = SITE_NAV_ORDER } = {}) {
  const visible = SITE_PAGES.filter(page => page.nav !== false && (!page.devOnly || reveal));
  const pages = order.public || reveal ? sortPagesByOrder(visible, order.ids) : visible;
  mountEl.innerHTML = pages
    .map(page => `<a href="${page.href}"${page.id === activeId ? ` class="current"` : ""}>${tt(page.label)}</a>`)
    .join("");
}

if (typeof module !== "undefined") module.exports = { SITE_PAGES, SITE_NAV_ORDER, sortPagesByOrder, renderSiteNav };
