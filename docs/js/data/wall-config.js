/**
 * MURAL DE RECADOS (a plateia escreve, o moderador aprova, o telão mostra). Só dado, sem lógica; as regras do Firestore repetem os limites (um teste confere em tools/questions/wall-rules.test.js).
 *   collection    coleção do Firestore (`mural-wall`)  |  open: false fecha o envio NA HORA (interruptor manual: a página mostra "recados encerrados" e o QR sai do telão)
 *   window        quando o envio vale: `from` e `until` (ISO com fuso; hoje o dia do evento, das 08:00 às 17:30). Antes dela a página diz quando abre; depois, que encerrou (features/wall-window.js)
 *   maxLength     tamanho do recado (ESPELHAR a regra: 120 = "size() < 121")  |  maxNickname: apelido opcional (30)  |  maxPerPerson: recados por aparelho (3, ESPELHAR `wall-[1-3]` nas regras)
 *   prompts       as perguntas que a pessoa escolhe: `id` (vai no recado), `label` (a pergunta, em letra grande no telão), `placeholder` (a ajuda do campo). O telão tem uma cena por pergunta (data/mural-scenes.js, `params.prompt`).
 *   blocklist     palavras que a página recusa antes de enviar (filtro de primeira linha: o moderador SEMPRE aprova antes de ir ao ar; ver features/wall-text.js)
 */
const WALL_CONFIG = {
  collection: "mural-wall",
  open: true,
  window: { from: "2026-11-28T08:00:00-03:00", until: "2026-11-28T17:30:00-03:00" },
  maxLength: 120,
  maxNickname: 30,
  maxPerPerson: 3,
  prompts: [
    { id: "buscar", label: "O que você veio buscar?", placeholder: "Conhecer gente, aprender, trocar ideia..." },
    { id: "recado", label: "Um recado para quem você veio encontrar", placeholder: "Escreva com carinho, vai pro telão" },
    { id: "significou", label: "O que o DevFest significou para você?", placeholder: "Em uma frase" },
  ],
  blocklist: ["puta", "putaria", "caralho", "porra", "merda", "buceta", "cuzao", "viado", "viadinho", "arrombado", "babaca", "idiota", "imbecil", "fdp", "pqp", "vsf", "vtnc", "otario", "desgraca"],
};

const wallConfigRepository = createRepository(WALL_CONFIG, { prompt: id => WALL_CONFIG.prompts.find(prompt => prompt.id === id) ?? null });
