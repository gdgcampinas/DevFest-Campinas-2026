/**
 * Passo a passo de instalação do app por plataforma (usado quando o
 * navegador não oferece o botão nativo de instalar). O id é o mesmo que
 * features/install-platform.js devolve; "generic" é o fallback.
 * Nova plataforma = uma entrada aqui + uma regra em INSTALL_PLATFORM_RULES.
 */
const INSTALL_GUIDES = [
  {
    id: "ios-safari",
    title: "Instalar no iPhone ou iPad",
    steps: [
      "Toque em Compartilhar, o quadrado com a seta para cima, na barra do Safari.",
      "Role a lista e toque em Adicionar à Tela de Início.",
      "Confirme em Adicionar. O DevFest aparece como um app na sua tela.",
    ],
  },
  {
    id: "ios-other",
    title: "Instalar no iPhone ou iPad",
    steps: [
      "Toque em Compartilhar, o quadrado com a seta para cima, na barra do navegador.",
      "Escolha Adicionar à Tela de Início e confirme em Adicionar.",
      "Se essa opção não aparecer, abra este endereço no Safari e repita os passos.",
    ],
  },
  {
    id: "android-chromium",
    title: "Instalar no Android",
    steps: [
      "Toque nos três pontinhos no canto do navegador.",
      "Escolha Instalar app (ou Adicionar à tela inicial).",
      "Confirme. O DevFest aparece na sua tela de apps.",
    ],
  },
  {
    id: "android-firefox",
    title: "Instalar no Android",
    steps: [
      "Toque nos três pontinhos no canto do Firefox.",
      "Escolha Instalar (ou Adicionar à tela inicial).",
      "Confirme. O DevFest aparece na sua tela de apps.",
    ],
  },
  {
    id: "desktop-chromium",
    title: "Instalar no computador",
    steps: [
      "Clique no ícone de instalar, na ponta direita da barra de endereço.",
      "Se ele não aparecer, abra o menu de três pontinhos e escolha Instalar DevFest Campinas.",
      "Confirme. O app abre em janela própria.",
    ],
  },
  {
    id: "desktop-safari",
    title: "Instalar no Mac",
    steps: [
      "No menu Arquivo do Safari, escolha Adicionar ao Dock.",
      "Confirme o nome e clique em Adicionar.",
    ],
  },
  {
    id: "desktop-firefox",
    title: "Instalar no computador",
    steps: [
      "O Firefox no computador não instala apps. Abra este endereço no Chrome ou no Edge para instalar.",
      "Ou salve nos favoritos: a programação salva na sua agenda continua neste navegador.",
    ],
  },
  {
    id: "in-app",
    title: "Abra no navegador",
    steps: [
      "Este link abriu dentro de outro app, que não permite instalar.",
      "Toque no menu (três pontinhos ou o ícone de compartilhar) e escolha Abrir no navegador.",
      "Depois toque em Instalar app de novo.",
    ],
  },
  {
    id: "generic",
    title: "Instalar o app",
    steps: [
      "Abra o menu do seu navegador e procure por Instalar app ou Adicionar à tela inicial.",
      "Se não houver, use o Chrome, o Edge ou o Safari.",
    ],
  },
];

const installGuidesRepository = createRepository(INSTALL_GUIDES, {
  /** Guia da plataforma; cai no "generic" se o id não existir. */
  getByPlatform: id => INSTALL_GUIDES.find(guide => guide.id === id) || INSTALL_GUIDES.find(guide => guide.id === "generic"),
});
