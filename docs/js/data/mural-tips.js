/**
 * Dicas e avisos da cena "dicas" do mural. Cada item: `title`, `text`, `icon` (nome de data/icons.js), `enabled`, e janela opcional `from`/`until`
 * (ISO com fuso) pra um aviso que vale só num horário. Sem item ativo a cena não aparece. Os itens com `enabled: false` são os que ainda
 * dependem de informação da organização (Wi-Fi, estacionamento, comida): preencher o texto e ligar. Aviso por celular (ao vivo) fica pra Fase 2.
 */
const MURAL_TIPS = [
  { id: "checkin", icon: "check", title: "Faça check-in", text: "Escaneie o QR da sala em cada palestra. Ele libera as perguntas e a avaliação." },
  { id: "perguntas", icon: "chat", title: "Pergunte ao vivo", text: "Mande sua pergunta pelo celular e vote nas dos colegas. As melhores sobem no telão da sala." },
  { id: "agenda", icon: "star", title: "Monte sua agenda", text: "Toque na estrela das palestras que você quer ver e leve a sua agenda no celular." },
  { id: "avaliar", icon: "sparkles", title: "Avalie as palestras", text: "Sua nota ajuda quem palestrou e quem organiza a próxima edição." },
  { id: "wifi", icon: "link", title: "Wi-Fi do evento", text: "Rede e senha: a definir com a organização.", enabled: false },
  { id: "estacionamento", icon: "grid", title: "Estacionamento", text: "Onde estacionar: a definir com a organização.", enabled: false },
  { id: "comida", icon: "gift", title: "Comida e café", text: "Onde comer: a definir com a organização.", enabled: false },
];

const muralTipsRepository = createRepository(MURAL_TIPS, {
  /** Os itens ligados e dentro da janela de datas, na ordem do dado. */
  getActive: (now = new Date()) => MURAL_TIPS.filter(tip => tip.enabled !== false
    && (!tip.from || now >= new Date(tip.from))
    && (!tip.until || now < new Date(tip.until))),
});
