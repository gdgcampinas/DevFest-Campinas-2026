/**
 * Os arquivos de MARCA que as telas reusam (mascote Gumbleton e logo do GDG Campinas), num lugar só: trocar um arquivo é editar este dado. Uso autorizado pelo Renato em 2026-10-09 ("sempre pode usar":
 * deixa o site e as telas mais felizes). Respeitar o documento de marca (arquivo oficial, sem distorcer, sem recolorir). Os caminhos são relativos à raiz do site (todas as páginas ficam na raiz).
 *   mascot  Gumbleton (fênix)  |  logo  logo do GDG Campinas pra fundo escuro  |  icon  o ícone do GDG (favicon)
 */
const BRAND = {
  mascot: "assets/img/gumbleton.png",
  logo: "assets/brand/gdg-logo-dark.svg",
  icon: "assets/brand/gdg-icon.svg",
};

const brandRepository = createRepository(BRAND);
