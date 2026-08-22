/**
 * Nav do site — 1 fonte só pras 5 páginas (Principal/Grade/
 * Palestrantes/Time/Código de Conduta). Cada página só chama
 * renderSiteNav(seu-id, mountEl); trocar um link ou adicionar página
 * nova é editar só aqui, nunca precisa tocar HTML de cada página.
 */
const SITE_PAGES = [
  { id: "principal", label: "Principal", href: "index.html" },
  { id: "grade", label: "Grade", href: "grade.html" },
  { id: "palestrantes", label: "Palestrantes", href: "palestrantes.html" },
  { id: "time", label: "Time", href: "time.html" },
  { id: "cod", label: "Código de Conduta", href: "codigo-de-conduta.html" },
];

function renderSiteNav(activeId, mountEl) {
  mountEl.innerHTML = SITE_PAGES
    .map(page => `<a href="${page.href}"${page.id === activeId ? ` class="current"` : ""}>${page.label}</a>`)
    .join("");
}
