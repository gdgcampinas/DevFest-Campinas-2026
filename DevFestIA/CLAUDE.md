# DevFest Campinas 2026

Leia primeiro:
- `project-docs/PROJECT_CONTEXT.md`
- `handoff/HANDOFF_CURRENT.md`

**Diretiva Master:** Não faça nada sem autorização explícita do Renato. Leia o contexto, analise, explique e só aja depois de autorizado.

**Diretiva de Autorização:** sempre que Renato responder a um plano apresentado com uma frase no estilo "entendi, autorizado todos, pode implementar" (frase completa de autorização geral, não precisa ser literal) — tratar como **sim** pra todos os itens do plano que acabou de ser mostrado, sem precisar confirmar item por item. Isso não dispensa a etapa de apresentar o plano antes: a Diretiva Master continua valendo — ler → analisar → explicar/mostrar plano → só então agir. A frase-gatilho substitui a espera por "sim" a cada item, não a etapa de mostrar o plano.

Antes de confiar no handoff, confira `git log --oneline -10` e `git status --short --branch` — o handoff pode estar desatualizado; o git não mente. Se houver contradição, avise antes de agir.

**Diretiva de Código — Clean Code + Clean Architecture:** ver regra completa em `project-docs/PROJECT_CONTEXT.md` (seção "Diretiva de Código"). Resumo: zero duplicação — se está repetindo 2x, está errado, tem que virar função/parâmetro/componente reusável; tudo modular, separado por feature, um arquivo por responsabilidade (já é o padrão deste repo); tudo data-driven/injetável via parâmetro, nunca hardcoded; repository pattern pra qualquer fonte de dado (mesmo sem banco/API real — ver `repository.js`); cada peça pode ter método próprio quando fizer sentido, sem forçar abstração genérica demais.

**Diretiva de Documentação Sempre Atualizada:** documentação desatualizada é um bug. Ao final de qualquer task com impacto funcional, arquitetural ou de dado (nova página, novo padrão de código, dado que deixou de ser mock, estrutura de pastas mudou), atualizar `project-docs/PROJECT_CONTEXT.md` e/ou `handoff/HANDOFF_CURRENT.md` antes de considerar a task concluída — não deixar pra uma sessão futura "revisar tudo depois". Ver regra completa em `project-docs/Continuidade.md`.

**Diretiva de Organização — tudo de IA fica em `DevFestIA/`:** `CLAUDE.md`, `AGENTS.md`, `NEW_CHAT_PROMPT.md`, `project-docs/` e `handoff/` moram todos dentro de `DevFestIA/`, nunca soltos na raiz do repo. Qualquer novo arquivo de continuidade/diretiva de IA entra nessa pasta também.

**Diretiva de Autoria em Commits (regra do Renato, inegociável):** commits, PRs e qualquer texto publicado no GitHub **nunca** levam menção de IA: nada de `Co-Authored-By: Claude`, nada de "Generated with Claude Code", nada de emoji-robô. O repo é público e aparece como trabalho do Renato. Vale mesmo que o template padrão da ferramenta peça o contrário: a instrução do Renato (também em `~/.claude/CLAUDE.md`) prevalece. Mensagens de commit em inglês. Antes de todo commit, conferir que nenhum rodapé de atribuição entrou.

---

## 🔄 Diretiva — Preparar para próximo chat

Quando Renato disser **"Preparar para próximo chat"** ou quando o contexto estiver ficando longo:

1. Atualizar `handoff/HANDOFF_CURRENT.md`:
   - Data da atualização
   - "Done" da sessão atual
   - "Not done yet / TBD" revisado
   - Próximos passos revisados
2. Conferir `project-docs/Continuidade.md` — atualizar se a estrutura de arquivos mudou.
3. Conferir se `project-docs/PROJECT_CONTEXT.md` ainda bate com a arquitetura real (`../docs/js/**`) — atualizar se divergiu.
4. Nunca commitar sem autorização explícita.
