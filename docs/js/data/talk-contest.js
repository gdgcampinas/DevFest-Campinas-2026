/**
 * Concurso da sessão (Coding Jam): configuração. Quem tem check-in na sessão cadastra o PRÓPRIO projeto (nome da pessoa e do
 * projeto), a turma vota (um voto por check-in, nunca no próprio) e o moderador publica o pódio. Só acontece em palestra cujo
 * destaque tem `contest: true` (data/talk-highlights.js). A janela de horário usa a MESMA trava das perguntas
 * (`enforceWindow` de data/talk-questions.js, espelho de `windowEnforced()` nas regras), então não há um segundo interruptor.
 *   enabled          chave geral (só ligar com as regras `contest-*` do Firestore publicadas)
 *   maxLength        tamanho máximo do nome e do projeto (espelhar as regras: "size() < 81")
 *   refreshMinMs     intervalo mínimo entre duas leituras da lista de projetos pela mesma pessoa (cada leitura custa 1 por projeto;
 *                    por isso a lista só recarrega ao abrir e no botão "Atualizar", nunca sozinha)
 *   pollMs           de quanto em quanto tempo o bloco confere se a sessão já abriu ou fechou e redesenha (não lê nada do banco)
 *   moderatorRefreshMs  de quanto em quanto tempo a tela do moderador relê projetos e votos pra recontar
 *   resultsPollMs    de quanto em quanto tempo os cards da grade conferem se o pódio já saiu (1 leitura por conferência, só depois da sessão)
 */
const TALK_CONTEST = {
  enabled: true,
  maxLength: 80,
  refreshMinMs: 15000,
  pollMs: 15000,
  moderatorRefreshMs: 20000,
  resultsPollMs: 120000,
};

const talkContestConfigRepository = createRepository(TALK_CONTEST);
