/**
 * Créditos do Google Cloud para a sessão prática (Coding Jam), em PORTUGUÊS e por dado: a página (creditos.html), o card de "Antes de vir",
 * o botão do modal do Coding Jam e o cartaz de impressão (cartaz-creditos.html) leem tudo daqui; trocar link, horário ou texto não toca em tela.
 * Só em DEV até `public: true`.
 *
 *   sessionId     a sessão paralela que usa os créditos (data/parallel-sessions.js: nome, lugar e rodadas moram lá, uma vez só)
 *   windows       as janelas de 12 horas que o GDG LATAM liberou (e-mail de 2026-11-13). Cada uma tem o link principal e o reserva (`-bkp`, só para quem teve
 *                 problema ou já resgatou o principal): `start`/`end` em ISO com fuso, `code` (nome do crédito), `url` e `qr` (imagem do QR). Fora da janela o
 *                 link não funciona, então a página só o mostra dentro dela (features/gcp-credit-window.js)
 *   requirements  cards "antes de começar" (components/info-card.js); steps = o passo a passo com a tela de cada um (`badge` opcional = selo de destaque do passo) (components/credit-steps.js)
 *   officialGuide / faq   materiais do Google, só linkados (não copiamos)
 *   texts         todas as frases da tela; `{date}`, `{n}`, `{start}` e `{end}` são trocados por quem renderiza
 * As telas dos passos vêm do guia oficial do Google (celular, tema escuro, evento de exemplo "DevFest ABCD 2026"): servem para a pessoa reconhecer cada tela.
 */
const GCP_CREDITS = {
  public: false,
  sessionId: "codejam",
  windows: [
    {
      id: "day",
      start: "2026-11-28T07:00:00-03:00",
      end: "2026-11-28T19:00:00-03:00",
      primary: { code: "gdg-campinas-4", url: "https://g.dev/credits/gdg-campinas-4", qr: "assets/img/gcp-credits/qr-gdg-campinas-4.webp" },
      backup: { code: "gdg-campinas-4-bkp", url: "https://g.dev/credits/gdg-campinas-4-bkp", qr: "assets/img/gcp-credits/qr-gdg-campinas-4-bkp.webp" },
    },
    {
      id: "night",
      start: "2026-11-28T19:00:00-03:00",
      end: "2026-11-29T07:00:00-03:00",
      primary: { code: "gdg-campinas-5", url: "https://g.dev/credits/gdg-campinas-5", qr: "assets/img/gcp-credits/qr-gdg-campinas-5.webp" },
      backup: { code: "gdg-campinas-5-bkp", url: "https://g.dev/credits/gdg-campinas-5-bkp", qr: "assets/img/gcp-credits/qr-gdg-campinas-5-bkp.webp" },
    },
  ],
  requirements: [
    {
      trackColor: "var(--google-blue)",
      icon: "info",
      title: "Só conta @gmail.com",
      body: "Conta de trabalho, da faculdade ou do Google Workspace não funciona. Cada conta resgata uma vez só.",
    },
    {
      trackColor: "var(--google-yellow)",
      icon: "clock",
      title: "Use o link da hora certa",
      body: "Cada link vale por 12 horas. A página mostra sozinha o link que está valendo agora.",
    },
    {
      trackColor: "var(--google-red)",
      icon: "shield",
      title: "Vale só para o Google Cloud",
      body: "Não vale para o AI Studio, nem para a API do Gemini cobrada por lá.",
    },
  ],
  steps: [
    { image: "assets/img/gcp-credits/01-login.webp", title: "Entre com seu Gmail", text: "Abra o link e entre com a sua conta @gmail.com. Se o Google pedir, confirme que é você." },
    { image: "assets/img/gcp-credits/02-claim.webp", badge: "O passo principal", title: "Toque em Claim Credit", text: "Aparece a tela Claim Your Benefit. Toque ou clique no botão Claim Credit (resgatar crédito)." },
    { image: "assets/img/gcp-credits/03-create-profile.webp", title: "Crie seu perfil", text: "Se pedir, escolha Create profile. É o perfil gratuito do Google Developer Program." },
    { image: "assets/img/gcp-credits/04-fill.webp", title: "Preencha seus dados", text: "Nome, cidade, profissão e empresa. Pode ser simples, o que importa é concluir." },
    { image: "assets/img/gcp-credits/05-submit.webp", title: "Envie o formulário", text: "Marque o que quiser e toque ou clique em Criar perfil." },
    { image: "assets/img/gcp-credits/06-verify.webp", title: "Confirme que é você", text: "Se aparecer a verificação de segurança (reCAPTCHA), toque em Clique para confirmar e depois em Continuar. Não aparece para todo mundo." },
    { image: "assets/img/gcp-credits/07-claimed.webp", badge: "Pronto!", title: "Crédito resgatado!", text: "Quando aparecer Successfully claimed your credit, está feito. A conta de faturamento pode levar até 5 minutos para aparecer." },
    { image: "assets/img/gcp-credits/08-billing.webp", title: "Use a conta de faturamento", text: "No Google Cloud, a conta com o crédito fica em Suas contas de faturamento. É ela que você liga ao seu projeto." },
  ],
  officialGuide: { label: "Guia oficial do Google (PDF)", url: "https://goo.gle/gcpcredits-en" },
  faq: { label: "Perguntas frequentes (FAQ)", url: "https://docs.google.com/document/d/1G9GX0DNNYW4g0GOHovgpaF0hhZIAisx-LMln2gNzqFE/view?usp=sharing&resourcekey=0-59bgWIiACe0SpJgF_4IKBg" },
  texts: {
    title: "Coding Jam: créditos do Google Cloud",
    intro: "Ganhe créditos do Google Cloud para construir no Coding Jam. Siga os passos com as telas e resgate antes de a sessão começar.",
    roundLine: "{n}ª rodada, das {start} às {end}",
    linkTitle: "Seu link de crédito",
    before: "Os links abrem em {date}. Volte neste dia para resgatar.",
    open: "Este link vale até {date}.",
    closed: "Os links de crédito já encerraram.",
    openButton: "Resgatar meu crédito",
    qrHint: "Ou aponte a câmera do celular para o QR",
    backupSummary: "Deu problema? Use o link reserva",
    backupText: "Use só se o primeiro não funcionou ou se você já resgatou aquele link.",
    backupButton: "Abrir o link reserva",
    requirementsTitle: "Antes de começar",
    stepsTitle: "Passo a passo",
    liveNow: "Link liberado agora",
    zoomHint: "Toque para ampliar",
    zoomLabel: "Tela do passo ampliada",
    stepsEnd: "Leu os passos? Agora é só resgatar:",
    stepsNote: "As telas são do guia do Google e mostram um evento de exemplo. O nome do evento na sua tela pode ser outro.",
    officialTitle: "Quer ver o guia do Google?",
    posterTitle: "Resgate seu crédito do Google Cloud",
    posterScan: "Aponte a câmera do celular para o QR",
    posterBackup: "Não funcionou? Chame um voluntário.",
    posterSite: "Passo a passo com telas no site do DevFest Campinas",
    creditsCard: "Resgate os créditos do Google Cloud para o Coding Jam",
    creditsLink: "Ver o passo a passo",
  },
};

const gcpCreditsRepository = createRepository(GCP_CREDITS);
