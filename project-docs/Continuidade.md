# Continuidade — como este processo funciona

Este projeto é documentado pra qualquer IA ou pessoa retomar o
trabalho sem depender do histórico de uma conversa específica.

- **[../CLAUDE.md](../CLAUDE.md)** / **[../AGENTS.md](../AGENTS.md)** —
  ponteiro curto na raiz: o que ler primeiro, Diretiva Master.
- **[../NEW_CHAT_PROMPT.md](../NEW_CHAT_PROMPT.md)** — bloco pronto
  pra colar como primeira mensagem de um chat novo.
- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** — arquitetura
  permanente: stack, estrutura de arquivos, decisões de design que não
  mudam com o tempo (por que não tem CSS por trilha, por que
  `schedule.dev.js` é gitignored, etc).
- **[handoff/HANDOFF_CURRENT.md](../handoff/HANDOFF_CURRENT.md)** —
  estado atual do projeto, diário de bordo. Atualizar a cada task
  concluída: o que foi feito, o que falta, próximos passos.
- **Este arquivo** — explica como os itens acima se relacionam.

## Regra de trabalho

Antes de mexer em qualquer coisa: ler `PROJECT_CONTEXT.md` (o que é
fixo) e `handoff/HANDOFF_CURRENT.md` (onde parou).

O handoff pode estar desatualizado — **o git não mente**. Antes de
confiar nele, rodar:

```bash
git status --short --branch
git log --oneline --decorate -10
```

Se houver contradição (ex.: handoff diz "não commitado" mas já tem
commits em `development`/`main`), sinalizar isso antes de agir, e dar
mais peso ao git do que ao texto do handoff.

Depois de terminar uma task:

1. Validar impacto em `PROJECT_CONTEXT.md`, `handoff/HANDOFF_CURRENT.md`
   e `README.md` — atualizar os que foram impactados.
2. Atualizar o handoff sempre que houver mudança funcional,
   arquitetural, decisão, pendência nova ou próximo passo relevante.
   Evitar virar diário de ruído (não registrar detalhe pequeno demais).
3. Se o handoff não for atualizado, explicar o motivo no resumo final.

Nunca commitar com assinatura de IA. Nunca mudar nada sem autorização
explícita de quem está pedindo o trabalho.
