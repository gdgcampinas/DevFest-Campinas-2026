# DevFest Campinas 2026 — Project Context

Multi-page site for DevFest Campinas 2026 (GDG Campinas), built the same way as [EloTech 2026](https://github.com/gdgcampinas/EloTech-Agibank): static HTML/CSS/JS, no build step, no framework, no backend, deployed via GitHub Pages from `docs/`.

## Stack (non-negotiable)

- Plain HTML/CSS/JS. Zero build, zero npm dependency. Fonts via Google Fonts CDN (Manrope + Public Sans).
- GitHub Pages source: `docs/` folder on `main`.
- Working branch: `development`. CI (`.github/workflows/validate.yml`) runs `node --check` on every push/PR to `development`; if it passes, `.github/workflows/promote.yml` fast-forward-merges `development` into `main` automatically. Never commit directly to `main`.

## Diretiva de Código — Clean Code + Clean Architecture

Regra permanente pra qualquer código escrito neste repo, não só sugestão de estilo:

- **Zero duplicação.** Se uma lógica, markup ou regra está escrita 2x, está errado — vira função, componente ou parâmetro reusável antes de seguir. O repo já segue isso (`track-card.js`, `info-card.js`, `person-card.js` servem qualquer trilha/pessoa/card sem duplicar HTML por instância).
- **Modular, uma responsabilidade por arquivo, separado por feature.** Já é o padrão: `data/` (dado puro) → `components/` (template puro) → `features/` (dado+template+comportamento) → `pages/` (bootstrap por página). Novo comportamento entra na camada certa, não misturado.
- **Tudo data-driven / injetável via parâmetro, nunca hardcoded.** Cor, ícone, contagem de trilha, lista de páginas do nav (`SITE_PAGES` em `site-nav.js`), hosts do header (`EVENT.hosts`) — tudo vem de dado passado como parâmetro pra função de render, nunca fixo no HTML/CSS. Ver "zero CSS por trilha" abaixo, é o exemplo canônico.
- **Repository pattern pra qualquer fonte de dado** — banco, API, ou (como aqui) array estático em memória. `docs/js/data/repository.js` (`createRepository()`) é esse padrão aplicado: acesso sempre via `algumaCoisaRepository.getAll()`, nunca a `const` global direto, mesmo sem backend hoje — se um dia isso virar API real, só a implementação de `createRepository()` muda, nada que consome via `getAll()` precisa mudar. Estilo "DI-lite" (parecido com repository pattern + injeção de dependência do Android): a peça que consome não sabe nem precisa saber de onde o dado realmente vem.
- **Cada peça pode ter método próprio quando fizer sentido** — não forçar toda função a caber numa interface genérica só por uniformidade; `extraMethods` em `createRepository()` existe exatamente pra isso (ex.: `sponsorsRepository.getByTier()`).

## Pages

Six pages, all zero-build HTML that share the same `<script>` block
(see `initShell()` below) and only differ in their last `<script>`
(`js/pages/*.js`):

| Page | File | Bootstrap |
|---|---|---|
| Principal (home) | `index.html` | `js/pages/home.js` |
| Grade completa | `grade.html` | `js/pages/grade.js` |
| Palestrantes | `palestrantes.html` | `js/pages/palestrantes.js` |
| Time | `time.html` | `js/pages/time.js` |
| Patrocínio | `patrocinio.html` | `js/pages/patrocinio.js` |
| Código de conduta | `codigo-de-conduta.html` | `js/pages/cod.js` |

## File architecture (one responsibility per file, zero duplication)

```
docs/
  index.html, grade.html, palestrantes.html, time.html,
  patrocinio.html, codigo-de-conduta.html   structure only, no logic
  css/styles.css                             design tokens (oklch) + all visual rules
  assets/icons/, assets/img/highlights/       favicons, event photos
  js/
    data/                    static data — nothing here touches the DOM
      repository.js            createRepository() factory — see below
      mock-speakers.js          mock speaker data (loads before schedule)
      schedule.js               PROD schedule (mock until line-up reveal)
      schedule.dev.js            DEV schedule (real, gitignored, local only)
      placeholder.js             placeholder image generator (mock logos)
      sponsors.js                sponsors/partners by tier
      partner-communities.js     partner community logos
      highlights.js               "highlights" photo grid data
      video.js                    recap video embed data
      stats.js                    last-edition stats (home)
      about.js                    "about the event" copy
      team.js, team-intro.js, team-photos.js   organizers (Time page)
      cod.js                      code of conduct text
      footer.js                   footer columns
      testimonials.js             testimonial quotes
      patrocinio.js                Patrocínio page copy/benefits
    components/              reusable templates, one responsibility each
      avatar.js                 photo or initials — automatic fallback
      site-nav.js                nav links shared by every page
      track-card.js               talk card (agenda + hero) + detail modal
      info-card.js                 generic "before you come" card
      sponsor-card.js               sponsor logo by tier
      person-card.js                 person card (team/speakers)
    features/                data + template + behavior, one section each
      agenda.js, live-status.js, talk-modal.js, speakers.js,
      featured-speakers.js, sponsors.js, partner-communities.js,
      team.js, cod.js, seo.js, stats.js, about.js, highlights.js,
      video.js, realizacao.js, tickets.js, footer.js,
      tracks-overview.js, testimonials.js, ticker.js, patrocinio.js
    pages/                   one bootstrap per page (see table above)
      home.js, grade.js, palestrantes.js, time.js, patrocinio.js, cod.js
    app.js                   initShell(): header, nav, footer, SEO,
                              ?demo=/?lineup= overrides — shared by every page

DevFestIA/                  ← AI continuity, not part of the site
  CLAUDE.md, AGENTS.md, NEW_CHAT_PROMPT.md
  project-docs/PROJECT_CONTEXT.md, project-docs/Continuidade.md
  handoff/HANDOFF_CURRENT.md

.github/workflows/
  validate.yml               CI: node --check on every .js, every push/PR
  promote.yml                CI: auto fast-forward development → main
```

## Repository pattern for static data

`docs/js/data/repository.js` exports `createRepository(data, extraMethods)`,
a thin factory (`{ getAll: () => data, ...extraMethods }`) that every
newer `data/*.js` file wraps its export in (e.g. `statsRepository`,
`sponsorsRepository`, `patrocinioIntroRepository`). It exists purely to
standardize *access* (`repository.getAll()` instead of referencing the
global `const` directly) — this site has no backend or API, so there is
no real fetch to hide. Must load before any `data/*.js` that calls
`createRepository()` (see script order in every page's `<head>`).

## Key design decision: zero per-track CSS

Every track-colored element (talk card, tab, legend item, modal detail,
"before you come" card) reads its color from `track.color` in
`schedule.js` and sets `--track-color` inline via JS. **No CSS rule
targets a track id** (no `.talk[data-track="ia"]{...}` style blocks).
Adding, renaming, or recoloring a track is a one-line change in
`TRACKS`, nothing to touch in `styles.css`.

Same principle applies to track count: grids use
`repeat(var(--track-count), 1fr)`, set once from `TRACKS.length` in
`initShell()` (`app.js`).

## Dev/prod pattern for sensitive data (line-up)

`docs/js/data/schedule.dev.js` holds real speaker data and is
gitignored — never committed before the public reveal. Every page's
`<script>` block tries to load it first (`onerror` fallback, no async);
if it 404s (always the case in production), it falls back to
`schedule.js` (mock/"coming soon"). `mock-speakers.js` must load before
either, since the mock schedule references `MOCK_SPEAKERS` directly.

To reveal the real line-up: copy `schedule.dev.js` content into
`schedule.js`, commit, push. From reveal onward, keep both files
identical — always edit both together.

## Header hosts (co-hosts/sponsors)

`EVENT.hosts` in `schedule.js` is an array, not a fixed pair — the
header renders 1..N logos with an auto-generated "+" separator
(`renderBrand()` in `app.js`). Add entries there when partners are
confirmed; no HTML/CSS change needed.

## Site nav

`docs/js/components/site-nav.js` is the single source of the page list
(`SITE_PAGES`). Every page calls `renderSiteNav(activePageId, mountEl)`
once from `initShell()`. Adding, renaming, or reordering a page is a
one-line change there — never edit nav HTML per page.

## Sponsors section

`docs/js/data/sponsors.js` exports `SPONSORS`, a list of
`{ tier, elements: [{name, link, imageUrl, description?}] }`. The
section (`js/features/sponsors.js`) hides itself entirely while empty.
Currently mock data (1 placeholder item per tier). Fill in tiers when
sponsors are confirmed.

## URL overrides (testing)

- `?demo=2026-11-28T09:15` (seconds optional) — simulates event time,
  advances in real time from that offset (never freezes).
- `?lineup=1` — forces the line-up to show even before
  `EVENT.lineupRevealed` is true.

## Deploy checklist

1. Edit files.
2. `node --check` every changed `.js` file.
3. Bump `?v=N` on every `<link>`/`<script>` in every `.html` whose
   referenced file content changed.
4. Test locally (`cd docs && python3 -m http.server 8080`), walk
   through `?demo=` transition points, check console for errors.
5. `git commit` (English, no AI co-author line, no AI mention).
6. `git push origin development`.
7. CI runs `node --check`, then auto-promotes to `main`. Confirm live
   via `curl`/browser before considering it done.

## TBD (fill in before the event)

- Event venue, address (`EVENT.venue`/`EVENT.address` in
  schedule.js/.dev.js — date `2026-11-28` already set).
- Track names/rooms/MCs (`TRACKS`).
- Real sponsors/partners (`sponsors.js` — still 1 mock item per tier).
- Real line-up (`schedule.dev.js`, gitignored — not created yet locally).
- Parking/food images (`PARKING_IMAGES`/`FOOD_IMAGES` in `app.js` —
  currently empty/commented).
- `docs/assets/img/` background/og-image — currently plain gradient,
  no photo asset (highlights photos from 2025 already in place).

## Documentation upkeep (standing directive)

Documentation must stay in sync with the real state of the repo, not
just with what a past session remembers. After any change with
architectural, functional, or data-state impact:

1. Check whether it changed something described in this file
   (architecture, file list, design decisions) — update it if so.
2. Update `handoff/HANDOFF_CURRENT.md` with what changed.
3. If in doubt whether docs are stale, cross-check against
   `git log`/`git status`, not against memory of a previous session.

See `project-docs/Continuidade.md` for the full rule.
