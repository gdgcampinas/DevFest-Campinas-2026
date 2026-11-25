/**
 * Dicas e avisos da cena "dicas" do mural. Cada item: `title`, `text`, `icon` (nome de data/icons.js), `enabled`, e janela opcional `from`/`until`
 * (ISO com fuso) pra um aviso que vale só num horário. Sem item ativo a cena não aparece. Os itens com `enabled: false` são os que ainda
 * dependem de informação da organização (Wi-Fi, estacionamento, comida): preencher o texto e ligar. Aviso por celular (ao vivo) fica pra Fase 2.
 * `exclusive: true` = a dica NÃO entra na cena "dicas" comum: só aparece na cena que a pede pelo id (`params.ids`), como a divulgação da agenda (data/agenda-promo.js).
 */
const MURAL_TIPS = [
  { id: "checkin", icon: "check", title: "Faça check-in", text: "Faça o check-in no site em cada palestra. Ele libera as perguntas e a avaliação." },
  { id: "perguntas", icon: "chat", title: "Pergunte ao vivo", text: "Mande sua pergunta pelo celular e vote nas dos colegas. As melhores sobem no telão da sala." },
  { id: "agenda", icon: "star", title: "Monte sua agenda", text: "Toque na estrela das palestras que você quer ver e leve a sua agenda no celular." },
  { id: "agenda-calendario", icon: "calendar", title: "Leve a agenda no calendário", text: "Exporte as palestras salvas para o calendário do celular ou mande a sua agenda no WhatsApp.", exclusive: true },
  { id: "avaliar", icon: "sparkles", title: "Avalie as palestras", text: "Sua nota ajuda quem palestrou e quem organiza a próxima edição." },
  { id: "wifi", icon: "link", title: "Wi-Fi do evento", text: "Rede e senha: a definir com a organização.", enabled: false },
  { id: "estacionamento", icon: "grid", title: "Estacionamento", text: "Onde estacionar: a definir com a organização.", enabled: false },
  { id: "comida", icon: "gift", title: "Comida e café", text: "Onde comer: a definir com a organização.", enabled: false },
];

const isTipActive = (tip, now) => tip.enabled !== false
  && (!tip.from || now >= new Date(tip.from))
  && (!tip.until || now < new Date(tip.until));

const muralTipsRepository = createRepository(MURAL_TIPS, {
  /** Os itens ligados e dentro da janela de datas, na ordem do dado, sem os exclusivos de uma cena. */
  getActive: (now = new Date()) => MURAL_TIPS.filter(tip => !tip.exclusive && isTipActive(tip, now)),
  /** Os itens pedidos pelo id (inclusive os exclusivos), na ordem dos ids, só os ligados e dentro da janela. */
  getByIds: (ids, now = new Date()) => ids.map(id => MURAL_TIPS.find(tip => tip.id === id)).filter(tip => tip && isTipActive(tip, now)),
});
