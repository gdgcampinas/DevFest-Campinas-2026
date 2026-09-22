# DevFest Campinas 2026 — Project Context

Multi-page site for DevFest Campinas 2026 (GDG Campinas), built the same way as [EloTech 2026](https://github.com/gdgcampinas/EloTech-Agibank): static HTML/CSS/JS, no build step, no framework, no backend, deployed via GitHub Pages from `docs/`.

## Stack (non-negotiable)

- Plain HTML/CSS/JS. Zero build, zero npm dependency. Fonts are self-hosted (Google Sans, OFL, `assets/fonts/`, `css/fonts.css`); no runtime calls to Google Fonts.
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

Seven pages, all zero-build HTML that share most of the same `<script>`
block (see `initShell()` below) and only differ in their last `<script>`
(`js/pages/*.js`) — a page with a lighter feature set (e.g. Ingressos)
also trims the shared block to what it actually uses, see the note below:

| Page | File | Bootstrap |
|---|---|---|
| Principal (home) | `index.html` | `js/pages/home.js` |
| Grade completa | `grade.html` | `js/pages/grade.js` |
| Palestrantes | `palestrantes.html` | `js/pages/palestrantes.js` |
| Ingressos | `ingressos.html` | `js/pages/ingressos.js` |
| Time | `time.html` | `js/pages/time.js` |
| Patrocínio | `patrocinio.html` | `js/pages/patrocinio.js` |
| Código de conduta | `codigo-de-conduta.html` | `js/pages/cod.js` |

**Nota sobre o `<script>` block de uma página nova e enxuta:** `initShell()`
sempre chama `renderHeaderMeta()`, que usa `hourLabel`/`eventDateLabel` de
`features/agenda.js` — esse arquivo precisa carregar em toda página mesmo
que ela não renderize a agenda (Ingressos é o primeiro caso; só define
funções, não executa nada sozinho, então incluir sem `favorites.js`/
`track-card.js` é seguro contanto que a página não chame `talkCardOptions`).
`data/tickets.js` também é obrigatório em toda página: `injectEventSchema()`
(em `initShell()`) lê `ticketsRepository.getAll()` para o schema.org.

## File architecture (one responsibility per file, zero duplication)

```
docs/
  index.html, grade.html, palestrantes.html, time.html,
  patrocinio.html, codigo-de-conduta.html   structure only, no logic
  css/fonts.css                              @font-face for the self-hosted Google Sans (loads first)
  css/tokens.css                             design tokens ONLY: brand palette, per-track colors, accent, fonts (loads first)
  css/styles.css                             all visual rules; consumes tokens, no literal brand color or font name
  assets/icons/, assets/img/highlights/       favicons, event photos
  js/
    data/                    static data — nothing here touches the DOM
      repository.js            createRepository() factory — see below
      persisted-set-repository.js  createPersistedSetRepository(): set of keys in an injected storage (localStorage)
      favorites.js              favoritesRepository + talkKey(slot, trackId)
      icons.js                  ICONS (svg paths by name) + iconsRepository.get(); also the per-track icons (`TRACKS[].icon`)
      install-guides.js         INSTALL_GUIDES (passo a passo por plataforma) + installGuidesRepository.getByPlatform()
      starfield.js               STAR_LAYERS (posições geradas, box-shadow) + BG_CIRCUIT_SRC + starfieldRepository
      analytics.js              ANALYTICS config (provider, endpoint, notice); empty endpoint = off
      tickets.js                TICKET_TYPES (Grátis / com camiseta / VIP, mock values) + TICKETS_NOTE
      talk-formats.js           TALK_FORMATS (palestra/workshop/painel/bate-papo) + getById()
      mock-links.js             MOCK_LINKEDIN_URL / MOCK_FACEBOOK_URL / MOCK_SPONSOR_URL (one place for all mock links)
      mock-photo.js             mockPhoto(id): hand-picked stock portraits (pravatar.cc) by number
      mock-logo.js              mockLogo({name, shape, color}): fictional company logo as inline SVG
      mock-speakers.js          40 mock speakers (id, name, cargo, photo, LinkedIn) + getById (loads before schedule)
      mock-talks.js             36 mock talks (9 per track, by position) linked to speakers by speakerIds
      schedule-builder.js        talkWindows/buildSchedule/catalogTalks (loads before schedule)
      schedule.js               PROD: EVENT, TRACKS, DAY_PLAN → SCHEDULE (mock until reveal)
      schedule.dev.js            DEV schedule (real, gitignored, local only)
      placeholder.js             placeholder image generator (mock logos)
      sponsors.js                sponsors/partners by tier
      partner-communities.js     partner community logos
      highlights.js               "highlights" photo grid data
      video.js                    recap video embed data
      stats.js                    last-edition stats (home)
      about.js                    "about the event" copy
      team.js, team-intro.js   organizers (Time page)
      cod.js                      code of conduct text
      footer.js                   footer columns
      testimonials.js             testimonial quotes
      patrocinio.js                Patrocínio page copy/benefits
    components/              reusable templates, one responsibility each
      modal.js                   createModal(id): the only modal markup and close behavior (X, backdrop, Esc)
      install-guide.js           installGuideMarkup(guide): body of the "how to install" modal
      avatar.js                 photo or initials — automatic fallback
      icon.js                    iconMarkup(name) — only svg template
      calendar-links.js          "Adicionar ao calendário" buttons of the talk modal
      agenda-actions.js          Minha agenda action bar markup (export, WhatsApp, copy link)
      speaker-link.js            speakerAnchorId/speakerProfileHref: how a speaker links to palestrantes.html#speaker-<id>
      favorite-button.js         favoriteButtonMarkup() — star, used in card/hero/modal
      talk-meta.js               talkTagsMarkup/talkAvatarsMarkup/talkLinksMarkup (format+tags, avatars, LinkedIn)
      site-nav.js                nav links shared by every page
      track-card.js               talk card (agenda + hero) + detail modal; options come from talkCardOptions() (agenda.js)
      info-card.js                 generic "before you come" card
      sponsor-card.js               sponsor/community item (logo box + name + optional description)
      person-card.js                 person card (team/speakers)
    features/                data + template + behavior, one section each
      agenda.js, track-filter.js, a11y.js, pwa.js, install-platform.js, starfield.js, analytics.js, calendar.js, talk-index.js, calendar-actions.js, agenda-share.js, live-status.js, talk-modal.js, favorites.js, favorites-filter.js, speakers.js,
      featured-speakers.js, sponsors.js, partner-communities.js,
      team.js, cod.js, seo.js, stats.js, about.js, highlights.js,
      video.js, realizacao.js, tickets.js, footer.js,
      tracks-overview.js, testimonials.js, ticker.js, patrocinio.js
    pages/                   one bootstrap per page (see table above)
      home.js, grade.js, palestrantes.js, time.js, patrocinio.js, cod.js
    app.js                   initShell(): header, ticker, nav, footer, SEO,
                              ?demo=/?lineup= overrides — shared by every page

DevFestIA/                  ← AI continuity and dev tooling, not part of the site
  CLAUDE.md, AGENTS.md, NEW_CHAT_PROMPT.md
  project-docs/PROJECT_CONTEXT.md, project-docs/Continuidade.md
  handoff/HANDOFF_CURRENT.md
  tools/                     check-meta.js (CI), check-install.js (CI), check-lineup.js, check-calendar.js, e2e-offline.js, e2e-kill-switch.js
  design/                    og-image.html, app-icon.html (sources of generated images)

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
- Load order in every page: `repository.js`, `mock-links.js`, `mock-photo.js`,
  `mock-logo.js`, `mock-speakers.js`, `mock-talks.js`, `schedule-builder.js`, then `schedule.dev.js`/`schedule.js`.

## Design tokens (colors and fonts)

All in `docs/css/tokens.css`, in three layers (only the first holds literals):
1. Brand palette `--google-blue/red/yellow/green` (same 4 colors as the new GDG Campinas logo; hex fallback then oklch).
2. Semantic: track colors `--ia`, `--webdata`, `--mobile`, `--mentoring` point at palette items; `--accent` (green, was `--neon`), `--live`, `--amber`.
3. Typography: `--font-display` and `--font-body`, both Google Sans (variable, weight 400-700, latin subset, self-hosted). Google Sans Text is NOT bundled: it is not in the open-source `google/fonts` repo, so its license for self-hosting is unconfirmed. `styles.css` never names a font.
Changing a color = edit `tokens.css`; changing the font = `fonts.css` + `tokens.css` + the `<link rel=preload>` in the 6 pages. Google Sans tops out at weight 700 on Google Fonts, so `800` declarations render as 700.

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

## Fundo estrelado

`initStarfield()` (features/starfield.js) injeta, uma vez por página via
`initShell()`, uma camada fixa atrás de todo o conteúdo (`.site-bg`,
`z-index:-1`, `pointer-events:none`): o acento de circuito colorido
(`assets/img/bg-circuit.webp`, `object-fit:contain`, sem esticar/cortar) e
duas camadas de estrelas geradas por CSS puro (`box-shadow` por ponto,
coordenadas fixas em `data/starfield.js`, não geradas em runtime). Tremeluzir
via `@keyframes`; a regra global de `prefers-reduced-motion` (topo do
styles.css) já zera a duração da animação para quem pede menos movimento,
sem código extra aqui. Nenhuma página tem esse HTML no próprio arquivo —
mesmo padrão do rodapé e do nav, uma função, seis páginas.

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

## Track rooms (historic places)

`TRACKS[].room` and the room of the Abertura/Encerramento banners in `DAY_PLAN` are built with `roomFor(place)` in schedule.js/.dev.js ("Sala <lugar>"): IA `Observatório`, Front/Back/Data `Estação`, Mobile/Agile `Lagoa do Taquaral`, Carreiras `Mercadão Central`, opening and closing `Calçadão Central`. The name pattern lives only in `roomFor`; changing a place is one argument. It shows in the Grade legend, talk cards, modal and the home "ao vivo agora" with no other code. Names are decorative and may not match the real venue rooms (venue still TBD).

## Track icons

Each entry in `TRACKS` (schedule.js/.dev.js) has `icon`, a name from `data/icons.js` (IA `sparkles`, Front/Back/Data `code`, Mobile/Agile `phone`, Carreiras `rocket`). Only the home "Trilhas" section shows it (`tracks-overview.js` via `iconMarkup`, default `grid` when a track has none). New track icon = one entry in `icons.js` + the `icon` field.

## Line-up model: talk <-> speaker <-> schedule (all interlinked)

- One source of people (`mock-speakers.js`, later the real line-up) and one catalog of talks (`mock-talks.js`). A talk references people only by `speakerIds`; `buildSchedule(plan, { speakerPool, talkCatalog })` resolves them into the same speaker objects (no copies) and warns in the console on an unknown id.
- Everything else derives from `SCHEDULE`: `extractSpeakers()` (features/speakers.js) builds the Palestrantes gallery AND the home "Destaques" pool, dedup by `id`, listing every talk of each person.
- Navigation both ways: speaker card -> talk (same modal as Grade, via `[data-slot-index][data-track]`), talk modal -> speaker profile (`palestrantes.html#speaker-<id>`, highlighted and scrolled on arrival), Destaques -> profile. LinkedIn appears on the talk card, the modal, the gallery card (mock URL: `MOCK_LINKEDIN_URL` in `mock-links.js`, one place).
- Favorites (`Minha agenda`) work in Grade, home hero, modal, and Palestrantes.
- Track filter (`features/track-filter.js`): one module for the tabs (`renderTabs`, optional per-track counts, `initTabSelection`) reused by Grade (`initTrackFilter`, cards) and Palestrantes (`initSpeakerTrackFilter`, people with a talk in that track, showing only that track's talks). A link to a speaker hidden by the filter (`#speaker-<id>`) resets the filter to "Todas as trilhas" via the injected `showAll`. The selected tab is centered on narrow screens.
- The line-up is public (`EVENT.lineupRevealed = true`) with mock data, by decision of the organizers. Real line-up = replace the catalog/speakers with same-shape data (photo, real LinkedIn).

## Site nav

`docs/js/components/site-nav.js` is the single source of the page list
(`SITE_PAGES`). Every page calls `renderSiteNav(activePageId, mountEl)`
once from `initShell()`. Adding, renaming, or reordering a page is a
one-line change there — never edit nav HTML per page.

## Mock content (until real data arrives)

All mock people, companies and links are fictional and live in `data/`: speakers and talks (see "Line-up model"), team (`team.js`, 6 organizers and 8 volunteers with Brazilian names; the Time page has no photo gallery), sponsors (`sponsors.js`, 5 tiers, 12 fictional companies with generated logos), partner communities (4), testimonials (3, with optional `role`). Person photos come from `mockPhoto()` (external stock service, hand-picked numbers; do not add numbers without looking at the image), logos from `mockLogo()`. Replacing mock with real = same shapes, real `photo`/`imageUrl`/`link`.

## Usage analytics

- Screens never call analytics. They tag elements with `data-track-event` (plus optional `data-track-place`, `data-track-target`, `data-track-kind`) and one delegated click listener in `features/analytics.js` turns each click into an event. Current events: `cta_click`, `talk_open`, `favorite_toggle`, `track_filter`, `my_agenda_view`, `calendar_add`, `agenda_export`, `agenda_share`, `shared_agenda_save`, `speaker_profile`, `sponsor_click`, `footer_link`, `pwa_install`. New event = add the attribute in the markup.
- The provider is an injected adapter (`ANALYTICS_ADAPTERS`, today only GoatCounter: cookieless, free, no personal data). `data/analytics.js` has `endpoint: ""`, so nothing loads until it is filled with `https://<code>.goatcounter.com/count` (account creation is up to the organizers). Moving to Google Analytics later = one new adapter + `provider`.
- Debug: open any page with `?analytics=debug` to log every event in the console.

## Offline (PWA)

- `docs/manifest.webmanifest` (installable, standalone), icons `assets/icons/icon-192.png` and `icon-512.png` (source `DevFestIA/design/app-icon.html`, regenerate when the new logo arrives), `docs/sw.js` (service worker) and `features/pwa.js` (registration, "Instalar app" button, "sem internet" bar).
- `sw.js` has no hand-written file list: on install it reads `SITE_PAGES` (importScripts of `site-nav.js`), fetches every page, everything they reference (src/href, including the schedule loaded through `onerror`), CSS `url()`s and the manifest icons. Pages are network-first (cache when offline, keyed by path so `?demo=`/`?agenda=` reuse it), files with `?v=N` or under `/assets/` are cache-first (the URL changes when the file does), everything else network-first. Same origin only (mock avatars from pravatar are not cached).
- Bump `SW_VERSION` in `sw.js` only when the worker logic changes (it drops old caches). Emergency: open any page with `?nosw=1` to remove the worker and its caches.
- "Instalar app" (`initInstallPrompt` in `pwa.js`): the button is always shown until the app is installed (`isRunningAsInstalledApp()`). With the native `beforeinstallprompt` (Chrome, Edge, Android) it opens the browser dialog; without it (iPhone/Safari, Firefox, in-app browsers) it opens a modal with the steps of the platform. `features/install-platform.js` picks the platform id from ordered rules (`INSTALL_PLATFORM_RULES`, pure, takes `{ ua, maxTouchPoints }`), `data/install-guides.js` holds the steps, `components/install-guide.js` the markup, `components/modal.js` the modal. New platform = one guide + one rule. The click carries `data-track-kind` `native` or `guide`. Every page that loads `pwa.js` must also load the six scripts above; `tools/check-install.js` (CI) fails if one is missing (Patrocínio was missing two, so the button would have thrown there).
- The manifest lists `any` and `maskable` icons separately (same files: the artwork already sits in the 60% safe zone) and has an `id`.
- The Browser pane in the desktop app does NOT support service workers; test with real Chrome (a CDP script drove it: install, offline reload of home/grade/speakers, kill switch).

## Share metadata and SEO

- Every page has static `og:*`, `twitter:*`, `canonical` and a per-page `description` in its `<head>` (social crawlers do not run JavaScript, so this repetition across the 6 pages is unavoidable in a zero-build site). `DevFestIA/tools/check-meta.js` (also a CI step) fails if any page is missing tags or has a wrong `og:url`, `og:image`, sitemap entry or robots line.
- `EVENT.url`, `EVENT.description`, `EVENT.image` in schedule.js/.dev.js are the source; `docs/assets/img/og-image.png` (1200x630) is rendered from `DevFestIA/design/og-image.html` (headless Chrome command in the file). Re-render it when the new logo arrives.
- `features/seo.js` builds the schema.org `Event` JSON-LD from EVENT, SCHEDULE and the ticket types (one `Offer` per type, `PreOrder` until `EVENT.tickets.salesOpen` is true; the venue name only when `EVENT.venueConfirmed`).
- `docs/sitemap.xml` and `docs/robots.txt` are static; add a page there and in `SITE_PAGES`.

## Calendar and sharing

- `features/calendar.js` is pure: one entry shape `{ uid, title, start, end, location, details, url }` feeds the Google Agenda link and the `.ics` (RFC 5545: CRLF, escapes, 75-octet folding, UTC times, 10 min alarm). `eventLocationLabel()` only includes the venue when `EVENT.venueConfirmed` is true.
- `features/talk-index.js` maps talkKey and a short share code (`0945.ia` = start time + track id) to schedule entries, and turns a talk into a calendar entry.
- `features/calendar-actions.js` (delegated click): per-talk `.ics` from the modal, and "Exportar (.ics)" for the whole Minha agenda. It returns the `{ index, event, siteUrl }` context that `initTalkDetails` and the share feature reuse.
- Sharing has no backend: `?agenda=0900.ia,1030.webdata` on the Grade. The owner gets a bar (export, WhatsApp, copy link); whoever opens the link sees a banner and can save all of it to their own agenda (`favoritesRepository.addAll`). Unknown codes are ignored.

## Accessibility rules (keep them)

- `--muted-dim` (tokens.css) is text-safe: at least 4.5:1 (WCAG AA) over cards and background. Do not go darker.
- No visible text below 12px. Keyboard focus is one global `:focus-visible` rule in styles.css; only add a specific one if the offset or radius must differ.
- `features/a11y.js`: skip link ("Pular para o conteúdo", target = first block after `<header>`, no markup per page), `prefersReducedMotion()` and `motionSafeBehavior()` for programmatic scrolling; CSS also shortens animations and transitions under `prefers-reduced-motion`.

## Tickets and the registration CTA

`features/tickets.js` has one source of CTA state, `ticketCtaState(EVENT.tickets)`: `url` set = buy button (Sympla), no url but `waitlistUrl` = "Avise-me quando abrir", neither = status pill ("Em breve"). It feeds every place the button shows: header (all pages, via `initShell`), fixed bottom bar on mobile (hides while the tickets section is on screen), hero countdown card, and the ticket cards on the home. Ticket types are data (`data/tickets.js`): name, price, benefits, color, `featured`/`badge`, optional per-type `url`. A type without `price` shows `TICKET_PRICE_TBD` ("Valor a definir") and no schema.org Offer; today only Grátis has a price (0). `EVENT.tickets.url` is empty until the event is published on Sympla, so every CTA (header, bar, hero, cards) shows the "Em breve" pill instead of a link; fill it and set `salesOpen: true` when sales open.

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

- Event venue and address (`EVENT.venue`, `venueConfirmed`; the date is set).
- Real room names and MCs (`TRACKS[].room/mc`; rooms are landmark mocks, MCs "MC a definir").
- Plenárias (full-width featured-speaker slot): mockup approved, variant A/B/C pending, see handoff.
- Real line-up (replace `mock-talks.js` and `mock-speakers.js` with same-shape data, real photos and LinkedIn), real sponsors and communities, testimonials, team, ticket values and the real Sympla link (`EVENT.tickets.url`, `salesOpen`).
- New logo files (header, favicons, app icons, share image) and the recap video of 2025 (`data/video.js` still has the 2017 one).
- Parking/food images (`PARKING_IMAGES`/`FOOD_IMAGES` in `app.js`, still empty).

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
