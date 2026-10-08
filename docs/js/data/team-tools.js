/**
 * Ferramentas INTERNAS da equipe (painel `equipe.html`): um atalho por tela, pra ninguém decorar endereço. Só dado: o painel desenha a lista e, nas que têm `perTrack`, um link por trilha (`?trilha=<id>`).
 * Todas são páginas internas (fora do menu e do sitemap, sem versão /DEV/): abrem na raiz. As de moderação pedem login Google de moderador.
 *   id | title | description   o que a pessoa lê   |   href   endereço relativo   |   perTrack   uma linha por trilha de TRACKS
 */
const TEAM_TOOLS = [
  { id: "mural", title: "Mural do telão", description: "A tela do LED. Abra no computador do telão, em tela cheia (Chrome em modo quiosque).", href: "mural.html" },
  { id: "mural-controle", title: "Controle do telão", description: "Avisos ao vivo, pausar ou fixar uma cena, recarregar e emergência. Pensado pro celular do moderador.", href: "mural-controle.html" },
  { id: "mural-fotos", title: "Fotos do telão", description: "Tirar do ar uma foto do álbum ao vivo que não deve aparecer no telão.", href: "mural-fotos.html?album=ao-vivo" },
  { id: "moderacao", title: "Perguntas ao vivo", description: "Aprovar e ordenar as perguntas de uma trilha (e publicar o pódio do Coding Jam).", href: "moderacao.html", perTrack: true },
  { id: "quadro", title: "Quadro da sala", description: "A TV de cada sala: perguntas, check-in e QR da sessão.", href: "checkin-display.html", perTrack: true },
  { id: "sorteio", title: "Sorteio (telão)", description: "A roda do sorteio em modo telão, no notebook do palco.", href: "DEV/sorteio.html?telao=1" },
];

const teamToolsRepository = createRepository(TEAM_TOOLS);
