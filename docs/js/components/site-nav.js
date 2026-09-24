/**
 * Nav do site — 1 fonte só pras páginas (Principal/Grade/Palestrantes/
 * Time/Patrocínio/Código de Conduta). Cada página só chama
 * renderSiteNav(seu-id, mountEl); trocar um link ou adicionar página
 * nova é editar só aqui, nunca precisa tocar HTML de cada página.
 * `nav: false` = página que existe (pré-cache offline, activeId) mas não
 * aparece no menu; a home linka pra ela num CTA (ex.: o quiz).
 */
const SITE_PAGES = [
  { id: "principal", label: "Principal", href: "index.html" },
  { id: "grade", label: "Grade", href: "grade.html" },
  { id: "palestrantes", label: "Palestrantes", href: "palestrantes.html" },
  { id: "ingressos", label: "Ingressos", href: "ingressos.html" },
  { id: "time", label: "Time", href: "time.html" },
  { id: "patrocinio", label: "Patrocínio", href: "patrocinio.html" },
  { id: "cod", label: "Código de Conduta", href: "codigo-de-conduta.html" },
  { id: "quiz", label: "Monte sua trilha", href: "quiz.html", nav: false },
];

function renderSiteNav(activeId, mountEl) {
  mountEl.innerHTML = SITE_PAGES
    .filter(page => page.nav !== false)
    .map(page => `<a href="${page.href}"${page.id === activeId ? ` class="current"` : ""}>${page.label}</a>`)
    .join("");
}
