/**
 * DIVULGAÇÃO DA "MINHA AGENDA" (só dado, sem lógica): a estrela que salva a palestra, o filtro "Minha agenda" da Grade, o calendário (.ics) e o WhatsApp já existiam, mas escondidos.
 * Aqui ficam o interruptor e os textos dos avisos que apresentam isso no site: cartão da home, dica na Grade, dica em Palestrantes, selo "Novo" no botão e a dica do telão.
 *   public       false = só no modo DEV (features/release-gate.js); true libera em produção. Sem janela de horário: a agenda serve para planejar antes do evento
 *   open         false fecha tudo na hora, seja qual for o modo (interruptor manual)
 *   badgeUntil   o selo "Novo" do botão "Minha agenda" some depois desta data (ISO com fuso)
 */
const AGENDA_PROMO = {
  public: false,
  open: true,
  badgeUntil: "2026-11-28T00:00:00-03:00",
};

const AGENDA_PROMO_TEXTS = {
  cardTitle: "Monte a sua agenda",
  cardText: "Toque na estrela das palestras que quer ver. Leve no celular, exporte para o calendário ou mande no WhatsApp.",
  cardButton: "Ver a programação",
  savedTitle: "Sua agenda no DevFest",
  savedButton: "Abrir minha agenda",
  gradeTip: "Toque na estrela de uma palestra para montar a sua agenda. Depois exporte para o calendário ou mande no WhatsApp.",
  speakersTip: "Gostou de uma palestra? Toque na estrela para salvar na sua agenda.",
  badge: "Novo",
};

const agendaPromoConfigRepository = createRepository(AGENDA_PROMO);
const agendaPromoTextsRepository = createRepository(AGENDA_PROMO_TEXTS);
