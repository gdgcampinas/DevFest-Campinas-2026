/**
 * Perguntas do feedback do evento, como dado. Trocar, incluir ou reordenar
 * aspectos é editar só esta lista (a tela e o relatório leem daqui).
 * ATENÇÃO: os ids dos aspectos precisam ser os mesmos de `validAspects` em
 * DevFestIA/firebase/firestore.rules (a regra é a defesa de verdade).
 */
const EVENT_FEEDBACK_FORM = {
  aspects: [
    { id: "organizacao", label: "Organização" },
    { id: "local", label: "Local e estrutura" },
    { id: "alimentacao", label: "Alimentação" },
    { id: "conteudo", label: "Conteúdo das palestras" },
    { id: "networking", label: "Networking" },
    { id: "comunicacao", label: "Comunicação" },
  ],
  nps: { question: "Você recomendaria o DevFest Campinas a um colega?", min: 0, max: 10, lowLabel: "Nem um pouco", highLabel: "Com certeza" },
};

const eventFeedbackFormRepository = createRepository(EVENT_FEEDBACK_FORM);
