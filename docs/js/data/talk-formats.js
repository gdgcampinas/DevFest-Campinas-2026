/**
 * Formatos de sessão. `id` é o valor de `format` no dado da palestra
 * (schedule.js); `icon` é um nome de data/icons.js. Formato novo =
 * uma linha aqui, nenhum CSS/JS muda. Palestra sem `format` (ou com
 * id desconhecido) simplesmente não mostra o chip.
 */
const TALK_FORMATS = [
  { id: "palestra", label: "Palestra", icon: "mic" },
  { id: "workshop", label: "Workshop", icon: "wrench" },
  { id: "painel", label: "Painel", icon: "users" },
  { id: "bate-papo", label: "Bate-papo", icon: "chat" },
];

const talkFormatsRepository = createRepository(TALK_FORMATS, {
  getById: id => TALK_FORMATS.find(format => format.id === id),
});
