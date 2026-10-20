/**
 * Arte do cartão "Eu vou!" (1080x1350, feed e stories), só dado. O cartão é uma ARTE PRONTA do design (fênix, trilhas, data, logos do GDG Campinas e do Google Developer Groups), uma por idioma
 * (`templates`: `default` = português; ganha `en` quando existir a versão em inglês, sem mexer em código). A pessoa só acrescenta o nome: a faixa "NOME vai!" desenhada na área livre da arte
 * (`namePill`: posição e tamanho em pixels do cartão). Os textos traduzidos ficam em data/i18n/en.js (`shareCard.*`).
 */
const SHARE_CARD_DESIGN = {
  size: { width: 1080, height: 1350 },
  templates: { default: "assets/img/share-card/eu-vou.webp" },
  namePill: { x: 60, y: 790, height: 84, maxWidth: 560, fontSize: 42 },
};

const shareCardDesignRepository = createRepository(SHARE_CARD_DESIGN);
