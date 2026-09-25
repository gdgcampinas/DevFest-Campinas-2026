# Continuidade — como este processo funciona

Este projeto é documentado pra qualquer IA ou pessoa retomar o
trabalho sem depender do histórico de uma conversa específica.

- **[../CLAUDE.md](../CLAUDE.md)** / **[../AGENTS.md](../AGENTS.md)** —
  diretivas de IA (tudo relacionado a IA fica isolado em `DevFestIA/`):
  o que ler primeiro, Diretiva Master.
- **[../NEW_CHAT_PROMPT.md](../NEW_CHAT_PROMPT.md)** —
  bloco pronto pra colar como primeira mensagem de um chat novo.
- **[PROJECT_CONTEXT.md](PROJECT_CONTEXT.md)** — arquitetura
  permanente: stack, estrutura de arquivos, decisões de design que não
  mudam com o tempo (por que não tem CSS por trilha, por que
  `schedule.dev.js` é gitignored, etc).
- **[handoff/HANDOFF_CURRENT.md](../handoff/HANDOFF_CURRENT.md)** —
  estado atual do projeto, diário de bordo. Atualizar a cada task
  concluída: o que foi feito, o que falta, próximos passos.
- **[../tools/](../tools/)** — scripts em Node, sem npm: verificação (`check-meta.js` e
  `check-install.js` rodam no CI; `check-lineup.js`, `check-calendar.js` e os `e2e-*.js` são manuais),
  `sympla-sync/` (job Sympla -> Firestore), `event-report/` (relatório do evento), `purge-test-data/`
  (limpeza dos dados de teste), `quiz/`, `questions/`, `room/`, `i18n/` (testes puros no CI; `questions/run-rules-tests.sh` testa as
  regras no emulador, local), `emulator/start.sh` (Firebase local pra testar o site inteiro com `?emulador=1`) e `lib/` (auth Google, cliente REST do
  Firestore e cliente do emulador); os testes de Node rodam no CI. **[../design/](../design/)** — fontes HTML das imagens geradas e o
  `build-brand-assets.sh` que regera favicon, ícones do app e imagem de compartilhamento a partir do
  SVG do logo. **[../firebase/](../firebase/)** — `firestore.rules` (colar à mão no console).
  Como usar cada um: seção "Como trabalhar e testar aqui" do handoff.
- **[`.github/workflows/`](../../.github/workflows/)** — ✅ Validar, 🚀 Publicar no main, 🎫 Sincronizar
  Sympla, 📊 Relatório do evento, 🧹 Limpar dados de teste. Ver PROJECT_CONTEXT ("Inscritos do
  Sympla", "Limpeza dos dados de teste") e o aviso sobre renomear o Validar no handoff.
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

## Ao retomar: checagens rápidas

- `git fetch origin` e ver se o remoto tem commits que você não tem
  (outra sessão ou máquina pode ter commitado). Se sim, `git pull
  --rebase origin development` antes de empurrar.
- Confirmar o que está no ar: `gh run list --repo gdgcampinas/DevFest-Campinas-2026`
  e `git ls-remote origin main development` (devem apontar pro mesmo commit).
- Runbook se o `🚀 Publicar no main` (antes `Promote to main`) falhar (já houve erro transiente do
  GitHub): `git fetch origin && git checkout main && git merge --ff-only
  origin/development && git push origin main && git checkout development`.
- Armadilhas conhecidas (cache de 10 min do HTML no GitHub Pages e navegador do WhatsApp, bump de
  `?v=N`, `SW_VERSION`, testes com Firebase e estado em memória, `prefers-reduced-motion`, secrets):
  seção "Como trabalhar e testar aqui" do handoff. Antes de mexer porque "o print está errado",
  confira com `curl` o que está publicado: muitas vezes era versão antiga em cache.
- Secrets do repositório (`SYMPLA_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`) existem e funcionam; nunca peça
  nem imprima o valor. Sem eles os workflows só avisam.

## Diretiva de Documentação Sempre Atualizada

Documentação desatualizada é tratada como um bug, não como débito
técnico aceitável. Regra obrigatória, não best-effort:

Depois de terminar qualquer task:

1. Validar impacto em `PROJECT_CONTEXT.md`, `handoff/HANDOFF_CURRENT.md`
   e `README.md` (raiz do repo) — atualizar os que foram impactados,
   **antes** de considerar a task concluída, não numa sessão futura.
2. Mudança que altera arquitetura, estrutura de pastas, padrão de
   código (ex.: `repository.js`), ou faz dado sair de mock pra real →
   sempre reflete em `PROJECT_CONTEXT.md`.
3. Mudança de estado, decisão tomada, pendência nova, risco ou próximo
   passo → sempre reflete em `handoff/HANDOFF_CURRENT.md`. Evitar virar
   diário de ruído (não registrar detalhe pequeno demais).
4. Se algum doc ficar sem atualizar mesmo assim, explicar o motivo no
   resumo final da sessão — nunca deixar em silêncio.
5. Numa revisão geral (Renato pedindo "atualiza toda a documentação"):
   reler o código real (`docs/js/**`) antes de reescrever os docs — não
   confiar em versões antigas do próprio doc como fonte de verdade.

Nunca commitar com assinatura de IA (nem `Co-Authored-By`, nem rodapé
de PR). Nunca mudar nada sem autorização explícita de quem está pedindo
o trabalho.
