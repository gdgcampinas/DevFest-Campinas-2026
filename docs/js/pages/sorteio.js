/**
 * Página: Sorteio. Cadastro (público, todo mundo) + roleta (área da organização, só moderador). Em construção:
 * `devOnly` no nav (SITE_PAGES) já esconde a aba fora do modo DEV; renderOrConstruction é a segunda camada,
 * pra quem cair direto na URL fora do DEV também ver "em breve" em vez do formulário de verdade.
 */
function initSorteio() {
  const reveal = initShell("sorteio");

  renderOrConstruction(reveal, document.getElementById("raffleSection"),
    () => {
      const signupEl = document.getElementById("raffleSignup");
      const { render } = initRaffleSignup(signupEl, { myRaffle: myRaffleRepository });
      render(signupEl);
      initRaffleDraw(document.getElementById("raffleMod"));
    },
    t("raffle.soon", "O sorteio será liberado em breve."));
}

initSorteio();
