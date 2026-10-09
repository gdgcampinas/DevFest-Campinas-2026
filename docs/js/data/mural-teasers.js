/**
 * "Daqui a pouco": as atrações grandes do dia que merecem um chamado no telão antes de começar (cena "teaser", data/mural-scenes.js). A cena mostra a que começa primeiro dentro da janela
 * `leadMinutes` e some quando não há nenhuma. Só dado:
 *   id | kicker (etiqueta, padrão "Daqui a pouco") | title (o nome da atração) | call (o convite) | enabled: false desliga
 *   source   de onde vem o horário de início, sem escrever hora aqui: `highlight` (id do destaque da sessão: "codejam", começa quando a palestra com esse destaque começa) ou `moment` (bloco da grade:
 *            "closing") ou `at` (ISO com fuso, pra algo fora da grade, como o sorteio, que o moderador também pode anunciar na hora pelo controle remoto)
 *   leadMinutes   quantos minutos antes do início a atração entra no rodízio
 */
const MURAL_TEASERS = [
  { id: "codejam", title: "Coding Jam", call: "Traga seu notebook e venha construir com a gente", source: { highlight: "codejam" }, leadMinutes: 30 },
  { id: "encerramento", title: "Encerramento", call: "Fique até o fim: é a hora de celebrar o dia juntos", source: { moment: "closing" }, leadMinutes: 20 },
  { id: "sorteio", title: "Sorteio", call: "Cadastre-se pelo QR e participe", source: { at: "" }, leadMinutes: 15, enabled: false }, // ligar quando o horário do sorteio estiver definido (source.at)
];

const muralTeasersRepository = createRepository(MURAL_TEASERS, { enabled: () => MURAL_TEASERS.filter(teaser => teaser.enabled !== false) });
