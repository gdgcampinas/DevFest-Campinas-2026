# DevFest Campinas 2026

Leia primeiro:
- `project-docs/PROJECT_CONTEXT.md`
- `handoff/HANDOFF_CURRENT.md`
- `NEW_CHAT_PROMPT.md` (nesta mesma pasta) se estiver iniciando uma nova sessão

**Diretiva Master:** Não faça nada sem autorização explícita do Renato. Leia o contexto, analise, explique e só aja depois de autorizado.

**Diretiva de Autorização:** sempre que Renato responder a um plano apresentado com uma frase no estilo "entendi, autorizado todos, pode implementar" (frase completa de autorização geral, não precisa ser literal) — tratar como **sim** pra todos os itens do plano que acabou de ser mostrado, sem precisar confirmar item por item. Isso não dispensa a etapa de apresentar o plano antes: a Diretiva Master continua valendo — ler → analisar → explicar/mostrar plano → só então agir.

Antes de confiar no handoff, confira `git log --oneline -10` e `git status --short --branch` — o handoff pode estar desatualizado; o git não mente. Se houver contradição, avise antes de agir.

**Diretiva de Código — Clean Code + Clean Architecture:** ver regra completa em `project-docs/PROJECT_CONTEXT.md` (seção "Diretiva de Código"). Resumo: zero duplicação, tudo modular por feature, data-driven/injetável via parâmetro, repository pattern pra qualquer fonte de dado.

**Diretiva de Documentação Sempre Atualizada:** documentação desatualizada é um bug. Ao final de qualquer task com impacto funcional, arquitetural ou de dado, atualizar `project-docs/PROJECT_CONTEXT.md` e/ou `handoff/HANDOFF_CURRENT.md` antes de considerar a task concluída. Ver regra completa em `project-docs/Continuidade.md`.

**Diretiva de Organização — tudo de IA fica em `DevFestIA/`:** `CLAUDE.md`, `AGENTS.md`, `NEW_CHAT_PROMPT.md`, `project-docs/` e `handoff/` moram todos dentro de `DevFestIA/`, nunca soltos na raiz do repo. Qualquer novo arquivo de continuidade/diretiva de IA entra nessa pasta também.

**Diretiva de Autoria em Commits:** todo commit feito pela IA leva `Co-Authored-By: Claude ... <noreply@anthropic.com>` — exigência de política da ferramenta, não removível a pedido. Se Renato quiser remover do histórico, é ele quem roda (nunca a IA):

```bash
git commit --amend -m "<mesma mensagem, sem Co-Authored-By>"
git push --force-with-lease origin development
git checkout main && git reset --hard origin/development && git push --force-with-lease origin main && git checkout development
```

Oferecer esse comando pronto logo depois de qualquer commit, sem esperar reclamação.
