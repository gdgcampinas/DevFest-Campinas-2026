# DevFest Campinas 2026

Leia primeiro:
- `project-docs/PROJECT_CONTEXT.md`
- `handoff/HANDOFF_CURRENT.md`

**Diretiva Master:** Não faça nada sem autorização explícita do Renato. Leia o contexto, analise, explique e só aja depois de autorizado.

Antes de confiar no handoff, confira `git log --oneline -10` e `git status --short --branch` — o handoff pode estar desatualizado; o git não mente. Se houver contradição, avise antes de agir.

---

## 🔄 Diretiva — Preparar para próximo chat

Quando Renato disser **"Preparar para próximo chat"** ou quando o contexto estiver ficando longo:

1. Atualizar `handoff/HANDOFF_CURRENT.md`:
   - Data da atualização
   - "Done" da sessão atual
   - "Not done yet / TBD" revisado
   - Próximos passos revisados
2. Conferir `project-docs/Continuidade.md` — atualizar se a estrutura de arquivos mudou.
3. Conferir se `project-docs/PROJECT_CONTEXT.md` ainda bate com a arquitetura real (`docs/js/**`) — atualizar se divergiu.
4. Nunca commitar sem autorização explícita.
