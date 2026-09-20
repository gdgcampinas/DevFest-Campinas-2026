# DevFest Campinas 2026 — Project Context

Multi-page site for DevFest Campinas 2026 (GDG Campinas), built the same way as [EloTech 2026](https://github.com/gdgcampinas/EloTech-Agibank): static HTML/CSS/JS, no build step, no framework, no backend, deployed via GitHub Pages from `docs/`.

## Stack (non-negotiable)

- Plain HTML/CSS/JS. Zero build, zero npm dependency. Fonts via Google Fonts CDN (Google Sans for titles + Google Sans Text for body).
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
  css/tokens.css                             design tokens ONLY: brand palette, per-track colors, accent, fonts (loads first)
  css/styles.css                             all visual rules; consumes tokens, no literal brand color or font name
  assets/icons/, assets/img/highlights/       favicons, event photos
  js/
    data/                    static data — nothing here touches the DOM
      repository.js            createRepository() factory — see below
      persisted-set-repository.js  createPersistedSetRepository(): set of keys in an injected storage (localStorage)
      favorites.js              favoritesRepository + talkKey(slot, trackId)
      icons.js                  ICONS (svg paths by name) + iconsRepository.get(); also the per-track icons (`TRACKS[].icon`)
      talk-formats.js           TALK_FORMATS (palestra/workshop/painel/bate-papo) + getById()
      mock-speakers.js          mock speaker data (loads before schedule)
      schedule-builder.js        talkWindows/buildSchedule/mockTalks (loads before schedule)
      schedule.js               PROD: EVENT, TRACKS, DAY_PLAN → SCHEDULE (mock until reveal)
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
      icon.js                    iconMarkup(name) — only svg template
      favorite-button.js         favoriteButtonMarkup() — star, used in card/hero/modal
      talk-meta.js               talkTagsMarkup/talkAvatarsMarkup/talkLinksMarkup (format+tags, avatars, LinkedIn)
      site-nav.js                nav links shared by every page
      track-card.js               talk card (agenda + hero) + detail modal; options come from talkCardOptions() (agenda.js)
      info-card.js                 generic "before you come" card
      sponsor-card.js               sponsor/community item (logo box + name + optional description)
      person-card.js                 person card (team/speakers)
    features/                data + template + behavior, one section each
      agenda.js, live-status.js, talk-modal.js, favorites.js, favorites-filter.js, speakers.js,
      featured-speakers.js, sponsors.js, partner-communities.js,
      team.js, cod.js, seo.js, stats.js, about.js, highlights.js,
      video.js, realizacao.js, tickets.js, footer.js,
      tracks-overview.js, testimonials.js, ticker.js, patrocinio.js
    pages/                   one bootstrap per page (see table above)
      home.js, grade.js, palestrantes.js, time.js, patrocinio.js, cod.js
    app.js                   initShell(): header, ticker, nav, footer, SEO,
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
`data/*.js` collection file wraps its export in (`statsRepository`,
`sponsorsRepository`, `teamRepository`, `testimonialsRepository`, ...);
page bootstraps read through `getAll()`. **Not wrapped yet:** `EVENT`,
`TRACKS`, `SCHEDULE` (read directly in dozens of places; needs its own pass). It exists purely to
standardize *access* (`repository.getAll()` instead of referencing the
global `const` directly) — this site has no backend or API, so there is
no real fetch to hide. Must load before any `data/*.js` that calls
`createRepository()` (see script order in every page's `<head>`).

## Schedule: day plan and builder

`schedule.js` only *declares* the day (`DAY_PLAN`); the time math and mock
talks live once in `data/schedule-builder.js`:

- `talkWindows("09:00", 4)` → 4 consecutive windows, each `talkMin` (40,
  Q&A included) + `gapMin` (5 changeover) = 45 min pitch.
- `buildSchedule(plan, { eventTime, tracks, speakerPool })` turns the plan
  into `SCHEDULE`. Plan items: `{ banner, room?, start, end }` (combined
  session) or `{ talks: [{start,end},...] }` (one slot per window, one
  mock talk per track, rotating `MOCK_SPEAKERS`).
- Current plan: 08:00 Credenciamento, 08:30 Abertura, 4 slots from 09:00,
  12:00 to 13:20 Almoço, 13:20 to 13:30 Retorno, 5 slots from 13:30,
  17:15 to 18:00 Encerramento (9 slots × 4 tracks).
- Changing hours or slot count = editing `DAY_PLAN`. `schedule.dev.js`
  must mirror it (edit both).
- Load order in every page: `repository.js`, `mock-speakers.js`,
  `schedule-builder.js`, then `schedule.dev.js`/`schedule.js`.

## Design tokens (colors and fonts)

All in `docs/css/tokens.css`, in three layers (only the first holds literals):
1. Brand palette `--google-blue/red/yellow/green` (same 4 colors as the new GDG Campinas logo; hex fallback then oklch).
2. Semantic: track colors `--ia`, `--webdata`, `--mobile`, `--mentoring` point at palette items; `--accent` (green, was `--neon`), `--live`, `--amber`.
3. Typography: `--font-display` (Google Sans) and `--font-body` (Google Sans Text). `styles.css` never names a font.
Changing a color or the font = edit `tokens.css` (plus the fonts `<link>` in the 6 pages). Google Sans tops out at weight 700 on Google Fonts, so `800` declarations render as 700.

## Key design decision: zero per-track CSS

Every track-colored element (talk card, tab, legend item, modal detail,
"before you come" card) reads its color from `track.color` in
`schedule.js` and sets `--track-color` inline via JS. **No CSS rule
targets a track id** (no `.talk[data-track="ia"]{...}` style blocks).
Adding, renaming, or recoloring a track is a one-line change in
`TRACKS`; the only CSS involved is the color token itself
(`--ia`, `--webdata`, `--mobile`, `--mentoring` in `tokens.css`), never a per-track rule. 4 tracks today: IA,
Front-end/Back-end/Data, Mobile/Agile, Carreiras & Mentorias.

Same principle applies to track count: the agenda grid and legend use
`repeat(var(--track-count), 1fr)`, set once from `TRACKS.length` in
`initShell()` (`app.js`). Generic card grids (`.faq-grid`, used by
"Antes de vir", "Trilhas", Patrocínio benefits) use
`repeat(auto-fit, minmax(240px, 1fr))` instead, so column count follows
the number of cards, not the number of tracks.

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

## Talk card and "Minha agenda" (favorites)

- Card (`trackCardMarkup`): track label + time chip (turns into "Em N min" for the next slot, "AGORA" + progress bar when live), title, optional format chip + up to 2 `#tags`, ringed avatar(s) with name, "cargo · empresa" and LinkedIn, footer with duration, star and room. Everything optional appears only if the talk data has it: `format` (id of `TALK_FORMATS`), `tags: []`, `speakers[].photo/title/company/linkedin`. The old `level` field is gone. Card options for agenda and "ao vivo agora" come from one place: `talkCardOptions()` in `agenda.js`.
- Favorites: `favoritesRepository` (localStorage key `devfest-campinas-2026:favorites`, no backend, per browser). Key = `talkKey(slot, trackId)` = slot start ISO + track id. `initFavorites(rootEl, repo)` is one delegated listener that syncs every star sharing a key (grade card, home hero, modal). Grade also has the "Minha agenda" toggle (`favorites-filter.js`), which respects the active track tab. Home hero shows the star too.
- Swap storage (or the whole repository for an API) by changing only the `createPersistedSetRepository` call in `data/favorites.js`.
- Formats and icons are data (`talk-formats.js`, `icons.js`): a new format is one line, no CSS.

## Track icons

Each entry in `TRACKS` (schedule.js/.dev.js) has `icon`, a name from `data/icons.js` (IA `sparkles`, Front/Back/Data `code`, Mobile/Agile `phone`, Carreiras `rocket`). Only the home "Trilhas" section shows it (`tracks-overview.js` via `iconMarkup`, default `grid` when a track has none). New track icon = one entry in `icons.js` + the `icon` field.

## Site nav

`docs/js/components/site-nav.js` is the single source of the page list
(`SITE_PAGES`). Every page calls `renderSiteNav(activePageId, mountEl)`
once from `initShell()`. Adding, renaming, or reordering a page is a
one-line change there — never edit nav HTML per page.

## Sponsors section

`docs/js/data/sponsors.js` exports `SPONSORS`, a list of
`{ tier, elements: [{name, link, imageUrl, description?}] }`. The
section (`js/features/sponsors.js`) hides itself entirely while empty.
`description` is optional; `sponsor-card.js` renders logo (white box) +
name + description when present. Partner communities reuse the same
function without a description. Currently mock data (1 placeholder item
per tier). Fill in tiers when sponsors are confirmed.

## Ticker

`features/ticker.js` builds the scrolling banner from `EVENT`/`SCHEDULE`
(no separate copy of name/date). `initShell()` calls it on every page
that has a `#ticker` element (all six do, right after `<body>`).

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
5. `git commit` (English, no AI co-author line, no AI mention, ever).
6. `git push origin development`.
7. CI runs `node --check`, then auto-promotes to `main`. Confirm live
   via `curl`/browser before considering it done.

## TBD (fill in before the event)

- Event venue, address (`EVENT.venue`/`EVENT.address` in
  schedule.js/.dev.js — date `2026-11-28` already set).
- Track rooms/MCs (`TRACKS`, still "Sala a definir" / "MC a definir"); names are set.
- Plenárias (full-width featured-speaker slot): mockup shown, decision pending, see handoff.
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
