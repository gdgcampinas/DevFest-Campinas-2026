/**
 * Textos do cartão e do formulário da lista de espera dos ingressos (plateia). Só dado: trocar uma frase não mexe em marcação nem em CSS. Os textos são traduzidos por igualdade (LOCALIZED_DATASETS em
 * app.js; o inglês está em data/i18n/en.js). `{email}` em `leave` vira o e-mail de contato (data/contact.js). Nada daqui é HTML: tudo é escapado na marcação (components/waitlist.js).
 */
const WAITLIST_TEXTS = {
  badge: "Ingressos em breve",
  title: "Os ingressos do DevFest Campinas abrem em breve",
  intro: "Deixe seu e-mail e a gente avisa você assim que as vagas abrirem. Quem está na lista fica sabendo primeiro.",
  steps: ["Deixe seu e-mail", "Avisamos quando abrir", "Garanta sua vaga"],
  openButton: "Avise-me quando abrir",
  formTitle: "Avise-me quando abrir",
  formIntro: "Mandamos um e-mail assim que os ingressos abrirem.",
  nameLabel: "Seu nome",
  emailLabel: "Seu e-mail",
  namePlaceholder: "Seu nome",
  emailPlaceholder: "seu@email.com",
  privacy: "Usamos seu e-mail só para avisar do DevFest Campinas. Você sai da lista quando quiser.",
  leave: "Para sair da lista, escreva para {email}.",
  submit: "Quero ser avisado",
  sending: "Enviando…",
  doneTitle: "Pronto, você está na lista",
  doneBody: "Avisamos no e-mail informado assim que os ingressos abrirem.",
  alreadyTitle: "Você já está na lista",
  alreadyBody: "Avisamos no e-mail que você deixou assim que os ingressos abrirem.",
  nameError: "Escreva seu nome.",
  emailError: "Confira o e-mail: parece que falta alguma coisa.",
  sendError: "Não deu para enviar agora. Confira a internet e tente de novo.",
  soonTitle: "Estamos preparando os ingressos",
  soonBody: "Os tipos e os valores serão revelados em breve. Quem está na lista de espera sabe primeiro.",
  soonLocked: "Em breve",
  loadError: "Não deu para abrir a lista agora. Tente de novo em instantes.",
};

const waitlistTextsRepository = createRepository(WAITLIST_TEXTS);
