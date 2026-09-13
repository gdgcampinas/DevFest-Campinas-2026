# Handoff — Current State

**Last updated:** 2026-09-13

## Status

Site publicado e em evolução ativa no branch `development` (sincronizado
com `origin/development`, working tree limpo, `main` idêntico). Não é
mais o scaffold de página única descrito em versões antigas deste
arquivo — hoje é um site de 6 páginas com dado real parcial. HEAD atual:
`1a73386` ("Move project-docs and handoff into DevFestIA folder, review
and refresh all documentation, add standing directives").

## Done

- Site multi-página: `index.html` (home), `grade.html`, `palestrantes.html`,
  `patrocinio.html`, `time.html`, `codigo-de-conduta.html`.
- Arquitetura modular mantida: `docs/js/data/` (dado), `components/`
  (templates), `features/` (dado+template+comportamento), `pages/` (um
  bootstrap por página), `app.js` (`initShell()` compartilhado: header,
  nav, footer, SEO, overrides de URL).
- Camada `docs/js/data/repository.js` (`createRepository()`) — padrão
  de acesso a dado tipo DI-lite, usada pelos data files mais recentes
  (stats, sponsors, patrocínio). Documentada em `PROJECT_CONTEXT.md`.
- Zero CSS por trilha mantido: cor/ícone/nível vêm de `TRACKS` em
  `schedule.js`, aplicados via `--track-color` inline.
- Seções que dependem de dado ainda não confirmado somem sozinhas
  (sponsors, stats, testimonials, featured-speakers) — sem HTML/CSS
  morto esperando conteúdo.
- Dado real já preenchido: números do DevFest 2025 (700 participantes,
  36+ horas, 37 palestrantes, 4 trilhas simultâneas), 16 fotos de
  highlights, depoimentos, ticker, seção "Destaques" (palestrantes
  rotativos), stack de páginas "Time" e "Patrocínio" com conteúdo real.
- `EVENT.date` fixado: `2026-11-28`.
- Todos os `.js` passam em `node --check` (verificado 2026-09-13).
- CI ativo: `.github/workflows/validate.yml` (`node --check` em todo
  push/PR) + `promote.yml` (auto-merge `development` → `main` quando
  o Validate passa).
- Estrutura de continuidade entre sessões alinhada ao padrão usado no
  Tá de Graça, isolada em `DevFestIA/`: `CLAUDE.md`, `AGENTS.md`,
  `NEW_CHAT_PROMPT.md`, `project-docs/` e `handoff/` (este arquivo)
  moveram todos pra lá. `Continuidade.md` tem a regra de cruzar handoff
  com git log antes de confiar nele.
- `PROJECT_CONTEXT.md` revisado e reescrito (2026-09-13) pra refletir
  a arquitetura real: 6 páginas, `pages/`, `site-nav.js`, `repository.js`,
  lista completa de `data/`/`features/`. Seção "Diretiva de Código —
  Clean Code + Clean Architecture" adicionada (zero duplicação, modular
  por feature, data-driven/injetável via parâmetro, repository pattern
  pra qualquer fonte de dado).
- Diretivas formalizadas em `CLAUDE.md`/`AGENTS.md`: Documentação
  Sempre Atualizada, Autorização (frase-gatilho "entendi, autorizado
  todos, pode implementar" = sim pro plano inteiro apresentado, sem
  pular a etapa de mostrar o plano), Organização (tudo de IA sempre em
  `DevFestIA/`), Autoria em Commits (a IA sempre leva `Co-Authored-By`
  por política da ferramenta, não removível a pedido — runbook de
  amend + force-push documentado pro Renato rodar quando quiser tirar
  do histórico público).
- Histórico do repo (público) limpo de qualquer menção a
  Claude/Anthropic — confirmado com `git log --all` em todos os
  branches/commits (2026-09-13). Contributors do GitHub pode continuar
  mostrando por um tempo — é cache assíncrono, não reflete git em
  tempo real; se não sumir sozinho depois de alguns dias, só suporte
  do GitHub resolve.

## Not done yet / TBD

- `EVENT.venue` / endereço — ainda `"Local a definir"`.
- `EVENT.lineupRevealed` — `false`; `docs/js/data/schedule.dev.js`
  (gitignored) ainda não existe localmente, line-up real não carregado.
- `sponsors.js` — mock, 1 item por tier, `link` aponta pra
  `example.com`; falta dado real de patrocinadores confirmados.
- `PARKING_IMAGES` / `FOOD_IMAGES` (em `app.js`) — vazios, comentados;
  falta imagem/copy de estacionamento e comida.
- Background/og-image — ainda gradiente puro, sem asset de foto.

## Next steps

1. Preencher dado real conforme for confirmado: patrocinadores,
   local/endereço, imagens de estacionamento/comida.
2. Quando o line-up for revelado: copiar `schedule.dev.js` →
   `schedule.js`, commit, push (ver `PROJECT_CONTEXT.md`).
