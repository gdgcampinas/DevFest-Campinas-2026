# Handoff — Current State

**Last updated:** 2026-09-13

## Status

Site publicado e em evolução ativa no branch `development` (sincronizado
com `origin/development`, working tree limpo). Não é mais o scaffold de
página única descrito em versões antigas deste arquivo — hoje é um site
de 6 páginas com dado real parcial.

## Done

- Site multi-página: `index.html` (home), `grade.html`, `palestrantes.html`,
  `patrocinio.html`, `time.html`, `codigo-de-conduta.html`.
- Arquitetura modular mantida: `docs/js/data/` (dado), `components/`
  (templates), `features/` (dado+template+comportamento), `pages/` (um
  bootstrap por página), `app.js` (`initShell()` compartilhado: header,
  nav, footer, SEO, overrides de URL).
- Nova camada `docs/js/data/repository.js` (`createRepository()`) —
  padrão de acesso a dado tipo DI-lite, usada pelos data files mais
  recentes (stats, sponsors, patrocínio). Ainda não documentada em
  `project-docs/PROJECT_CONTEXT.md`.
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
  Tá de Graça: `CLAUDE.md`, `AGENTS.md`, `NEW_CHAT_PROMPT.md` na raiz;
  `project-docs/Continuidade.md` com regra de cruzar handoff com git
  log antes de confiar nele.

## Not done yet / TBD

- `EVENT.venue` / endereço — ainda `"Local a definir"`.
- `EVENT.lineupRevealed` — `false`; `docs/js/data/schedule.dev.js`
  (gitignored) ainda não existe localmente, line-up real não carregado.
- `sponsors.js` — mock, 1 item por tier, `link` aponta pra
  `example.com`; falta dado real de patrocinadores confirmados.
- `PARKING_IMAGES` / `FOOD_IMAGES` (em `app.js`) — vazios, comentados;
  falta imagem/copy de estacionamento e comida.
- Background/og-image — ainda gradiente puro, sem asset de foto.
- `project-docs/PROJECT_CONTEXT.md` não reflete a arquitetura
  multi-página nem o `repository.js` — desatualizado, precisa de
  revisão (pendente autorização).

## Next steps

1. Revisar `project-docs/PROJECT_CONTEXT.md` pra refletir a
   arquitetura real (páginas, repository pattern).
2. Preencher dado real conforme for confirmado: patrocinadores,
   local/endereço, imagens de estacionamento/comida.
3. Quando o line-up for revelado: copiar `schedule.dev.js` →
   `schedule.js`, commit, push (ver `PROJECT_CONTEXT.md`).
