/**
 * Os arquivos de MARCA que as telas reusam (mascote Gumble e logo do GDG Campinas), num lugar só: trocar um arquivo é editar este dado. Uso autorizado pelo Renato em 2026-10-09 ("sempre pode usar":
 * deixa o site e as telas mais felizes). Respeitar o documento de marca (arquivo oficial, sem distorcer, sem recolorir). Os caminhos são relativos à raiz do site (todas as páginas ficam na raiz).
 *   mascot  Gumble (fênix)  |  logo  logo do GDG Campinas pra fundo escuro  |  icon  o ícone do GDG (favicon)  |  brackets  o logo dos colchetes do Google Developer Groups (redesenhado em SVG a partir da imagem do Renato; trocar pelo oficial é trocar o arquivo)
 */
const BRAND = {
  mascot: "assets/img/gumbleton.png",
  logo: "assets/brand/gdg-logo-dark.svg",
  icon: "assets/brand/gdg-icon.svg",
  brackets: "assets/brand/gdg-brackets.svg",
};

/** Rodapé do telão: `bracketsPublic` liga o logo dos colchetes ao lado do GDG Campinas (opção 1 do Renato, 2026-11-21). false = só ensaio (`telao.html?logos=1`); true libera em produção. */
const TELAO_FOOTER_CONFIG = { bracketsPublic: true }; // liberado em PROD em 2026-11-21 (pedido do Renato); false volta a mostrar só o logo do GDG Campinas

const brandRepository = createRepository(BRAND);
const telaoFooterConfigRepository = createRepository(TELAO_FOOTER_CONFIG);
