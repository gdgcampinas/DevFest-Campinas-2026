/**
 * Mensagens de acolhimento da cena "message" do mural (data/mural-scenes.js escolhe o conjunto por `params.set`). Só texto, sem lógica: trocar, acrescentar ou tirar uma frase é editar este arquivo.
 *   kicker   a etiqueta pequena em cima do texto  |  mode: "rotate" (cada passada da cena mostra a próxima frase), "fixed" (sempre a primeira) ou "daypart" (a frase do horário, no fuso do evento)
 *   items    cada um com `text` e, opcionalmente, `hint` (linha de apoio). `{nome}` vira o valor de MURAL_MESSAGE_VARS; se o valor estiver vazio o item usa `fallbackText` e `fallbackHint`
 *            (ou fica sem a linha), então dá pra deixar escrito já e preencher a variável depois, sem a frase sair pela metade.
 *   daypart  `from`/`until` em "HH:MM" (a janela pode passar da meia-noite); `moments` (opcional) escolhe a frase enquanto aquele bloco da grade está no ar ("back-to-room"): vence a janela de horário.
 * Quebra-gelo: perguntas pra puxar conversa entre desconhecidos, só no almoço, no café e quando o moderador anuncia uma pausa.
 */
const MURAL_MESSAGE_VARS = {
  shirt: "", // cor/identificação da camiseta dos voluntários; vazio = a frase usa o texto sem a cor. Ex.: "azul".
};

const MURAL_MESSAGES = {
  icebreaker: {
    kicker: "Quebra-gelo",
    mode: "rotate",
    items: [
      { text: "O que você está construindo agora?" },
      { text: "Fale com alguém que você nunca viu antes." },
      { text: "Qual foi a última coisa que você aprendeu e adorou?" },
      { text: "Qual palestra você não pode perder hoje? Conte pra alguém." },
      { text: "Descubra de que cidade é a pessoa ao seu lado." },
      { text: "Qual ferramenta mudou o seu jeito de trabalhar?" },
      { text: "Pergunte: qual foi o seu primeiro projeto?" },
      { text: "Apresente duas pessoas que ainda não se conhecem." },
      { text: "O que você gostaria de ensinar pra alguém hoje?" },
      { text: "Troque um contato antes do próximo café." },
    ],
  },
  welcome: {
    kicker: "Primeira vez aqui?",
    mode: "fixed",
    items: [
      { text: "Você está em casa.", hint: "Procure a camiseta {shirt} dos voluntários e pergunte qualquer coisa.", fallbackHint: "Procure alguém da equipe de voluntários e pergunte qualquer coisa." },
    ],
  },
  greeting: {
    kicker: "DevFest Campinas",
    mode: "daypart",
    items: [
      { moments: ["back-to-room"], text: "Boa volta!", hint: "A tarde de palestras vai começar." },
      { from: "05:00", until: "12:00", text: "Bom dia, Campinas!", hint: "Que bom ter você aqui." },
      { from: "12:00", until: "18:00", text: "Boa tarde, Campinas!", hint: "Que bom ter você aqui." },
      { from: "18:00", until: "05:00", text: "Boa noite, Campinas!", hint: "Obrigado por fazer parte." },
    ],
  },
};

const muralMessagesRepository = createRepository(MURAL_MESSAGES, { vars: () => MURAL_MESSAGE_VARS });
