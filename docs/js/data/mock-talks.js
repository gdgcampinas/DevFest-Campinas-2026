/**
 * Catálogo MOCK de palestras: 9 por trilha, na ordem dos slots de
 * palestra do DAY_PLAN (posição 0 = primeiro slot, e assim por diante).
 * Não guarda horário: quem casa palestra com horário é o
 * buildSchedule(), então mudar o DAY_PLAN não quebra nada aqui.
 * Palestrantes entram só por `speakerIds` (ids de mock-speakers.js),
 * nunca por cópia dos dados da pessoa. `format` é um id de
 * data/talk-formats.js.
 * Precisa carregar depois de mock-speakers.js e antes de schedule-builder.js.
 */
const talk = (title, format, tags, speakerIds, description) => ({ title, format, tags, speakerIds, description });

const MOCK_TALKS_BY_TRACK = {
  ia: [
    talk("Agentes de IA em produção: o que aprendemos errando", "palestra", ["agentes", "produção"], ["ana-souza"],
      "Casos reais de agentes que falharam em produção e as práticas de avaliação, limites e observabilidade que os tornaram confiáveis."),
    talk("RAG sem dor de cabeça: busca, contexto e avaliação", "palestra", ["rag", "llm"], ["james-carter"],
      "Como montar um pipeline de recuperação que responde bem, quanto contexto enviar ao modelo e como medir a qualidade das respostas."),
    talk("Gemini e Gemma na prática: do protótipo ao app", "workshop", ["gemini", "gemma"], ["amara-okafor"],
      "Mão na massa: chamar modelos por API, rodar um modelo aberto localmente e integrar os dois em um app simples."),
    talk("Contexto é o novo prompt", "palestra", ["prompts", "llm"], ["priya-nair"],
      "Por que montar bom contexto importa mais do que frases mágicas, e como estruturar instruções, exemplos e ferramentas."),
    talk("IA responsável: viés, privacidade e o que fazer na segunda-feira", "painel", ["ética", "privacidade"], ["fatima-al-sayed", "chen-wei"],
      "Uma conversa prática sobre riscos de viés, vazamento de dados e checklists que times pequenos conseguem adotar já."),
    talk("Fine-tuning ou RAG? Como decidir sem chute", "palestra", ["fine-tuning", "rag"], ["rafael-lima"],
      "Um roteiro de decisão com custo, latência, dados disponíveis e manutenção para escolher a abordagem certa."),
    talk("Visão computacional no navegador com TensorFlow.js", "workshop", ["visão", "javascript"], ["sophia-bennett"],
      "Construa um detector de objetos que roda inteiro no navegador, sem servidor e sem enviar imagens para lugar nenhum."),
    talk("Copilotos de código: produtividade real ou ilusão?", "bate-papo", ["copilotos", "produtividade"], ["noah-bryant"],
      "Um papo aberto sobre onde assistentes de código ajudam de verdade, onde atrapalham e como medir o ganho."),
    talk("MLOps para times pequenos", "palestra", ["mlops", "cloud"], ["ethan-wright"],
      "Deploy, monitoramento e retreino de modelos sem uma equipe de plataforma: o mínimo que funciona."),
  ],
  webdata: [
    talk("Design systems que escalam sem virar burocracia", "palestra", ["design-system", "front-end"], ["camila-rocha"],
      "Governança leve, tokens e componentes que times realmente usam, e como evitar o design system que ninguém adota."),
    talk("Micro-frontends: quando vale e quando é armadilha", "palestra", ["arquitetura", "front-end"], ["olivia-chen"],
      "Critérios para decidir por micro-frontends, os custos escondidos e alternativas mais simples."),
    talk("APIs que não quebram clientes: versionamento na prática", "palestra", ["api", "backend"], ["omar-haddad"],
      "Estratégias de versionamento, depreciação e contratos para evoluir uma API sem derrubar quem a consome."),
    talk("Do zero ao dashboard: BigQuery e Looker Studio", "workshop", ["bigquery", "dados"], ["kwame-mensah"],
      "Carregue dados, escreva consultas eficientes e publique um dashboard compartilhável em uma sessão."),
    talk("Observabilidade para times pequenos", "palestra", ["observabilidade", "sre"], ["daniel-reyes"],
      "Logs, métricas e traces sem complicação: o que instrumentar primeiro e como não se afogar em alertas."),
    talk("Arquitetura orientada a eventos sem mistério", "painel", ["eventos", "arquitetura"], ["carlos-mendes", "nathalia-ribeiro"],
      "Duas visões, de backend e de dados, sobre filas, eventos e consistência: quando ajudam e quando complicam."),
    talk("Performance web em 2026: os Core Web Vitals que importam", "palestra", ["performance", "web"], ["thiago-araujo"],
      "Medir, priorizar e corrigir o que de fato muda a experiência do usuário, com exemplos antes e depois."),
    talk("PostgreSQL além do básico: índices, planos e JSONB", "workshop", ["postgresql", "banco-de-dados"], ["isabella-moore"],
      "Leia planos de execução, escolha índices e use JSONB com critério, em consultas reais."),
    talk("Pipelines de dados confiáveis", "palestra", ["engenharia-de-dados", "qualidade"], ["yasmin-khalil"],
      "Testes de dados, contratos e reprocessamento para pipelines que não acordam ninguém de madrugada."),
  ],
  mobile: [
    talk("Kotlin Multiplatform na prática: vale a pena em 2026?", "painel", ["kmp", "multiplataforma"], ["hiro-tanaka", "joao-pedro-almeida"],
      "Android e iOS conversam sobre compartilhar código de verdade: ganhos, limites e o que ainda dói."),
    talk("Flutter ou nativo: como decidir sem guerra de time", "bate-papo", ["flutter", "nativo"], ["pedro-santos"],
      "Um papo franco sobre critérios de escolha, custo de manutenção e contratação."),
    talk("Jetpack Compose avançado: performance e animações", "workshop", ["compose", "android"], ["mateus-oliveira"],
      "Recomposição, estado e animações fluidas: encontre e corrija gargalos em uma tela real."),
    talk("Squads ágeis de verdade: o que sobra depois do ritual", "palestra", ["agile", "squads"], ["juliana-ferreira"],
      "Quais cerimônias sustentam entrega e quais são só teatro, e como ajustar com o time."),
    talk("Acessibilidade em apps: o que quase todo mundo esquece", "palestra", ["acessibilidade", "ux"], ["sofia-alvarez"],
      "Leitores de tela, contraste, alvos de toque e testes simples que tornam um app usável por mais pessoas."),
    talk("Testes em mobile sem sofrimento", "palestra", ["testes", "qualidade"], ["mia-robinson"],
      "Uma pirâmide de testes possível para apps: o que automatizar, o que deixar manual e como manter estável."),
    talk("Kanban, Scrum ou nada: métricas que ajudam", "bate-papo", ["kanban", "métricas"], ["vinicius-barbosa"],
      "Lead time, throughput e outras métricas que orientam decisões sem virar cobrança."),
    talk("Apps offline-first com sincronização confiável", "workshop", ["offline-first", "sincronização"], ["marcus-lee"],
      "Modele dados locais, resolva conflitos e sincronize com o servidor sem perder informação."),
    talk("Do MVP à Play Store: publicando sem sustos", "palestra", ["lançamento", "startups"], ["leandro-pires"],
      "Checklist de publicação, testes fechados e erros comuns que atrasam o primeiro lançamento."),
  ],
  mentoring: [
    talk("Como pedir uma promoção sem constrangimento", "bate-papo", ["carreira", "promoção"], ["elisa-duarte"],
      "Como reunir evidências, conversar com a liderança e negociar o próximo passo com clareza."),
    talk("Do júnior ao sênior: o que ninguém conta", "palestra", ["carreira", "senioridade"], ["larissa-nunes"],
      "Além de código: escopo, influência e comunicação que separam os níveis de senioridade."),
    talk("Mentoria que funciona: como ser mentor e mentorado", "painel", ["mentoria", "comunidade"], ["renata-cardoso", "lucas-turner"],
      "Duas experiências sobre combinar expectativas, manter o ritmo e tirar valor real das conversas."),
    talk("Currículo e LinkedIn para quem está começando", "workshop", ["currículo", "linkedin"], ["gabriela-martins"],
      "Reescreva seu currículo e seu perfil com foco em resultados, com feedback ao vivo de quem recruta."),
    talk("Transição de carreira para tecnologia aos 30+", "bate-papo", ["transição", "carreira"], ["beatriz-costa"],
      "Uma história de virada, o que ajudou, o que atrapalhou e como aproveitar a bagagem anterior."),
    talk("Como se preparar para entrevistas técnicas", "workshop", ["entrevistas", "recrutamento"], ["rodrigo-menezes"],
      "Simule perguntas de código e de comportamento e aprenda o que as pessoas entrevistadoras realmente avaliam."),
    talk("Trabalho remoto e internacional: mitos e caminhos", "palestra", ["remoto", "internacional"], ["grace-coleman"],
      "O que é real e o que é lenda sobre trabalhar para fora, e um mapa de primeiros passos."),
    talk("Comunidade como carreira: o que aprendi em 10 anos de GDG", "palestra", ["comunidade", "gdg"], ["renata-cardoso"],
      "Como organizar eventos, construir rede e transformar contribuição em oportunidades profissionais."),
    talk("Saúde mental na tecnologia: limites, burnout e recomeços", "painel", ["saúde-mental", "bem-estar"], ["aline-teixeira", "tatiane-gomes"],
      "Uma conversa cuidadosa sobre sinais de esgotamento, limites saudáveis e como pedir ajuda."),
  ],
};

const mockTalksRepository = createRepository(MOCK_TALKS_BY_TRACK, {
  /** Palestra da trilha na posição `index` (ordem dos slots de palestra), ou undefined. */
  getFor: (trackId, index) => MOCK_TALKS_BY_TRACK[trackId]?.[index],
});
