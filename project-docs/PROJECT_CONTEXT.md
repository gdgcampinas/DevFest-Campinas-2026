# DevFest Campinas 2026 — Project Context

Live schedule site for DevFest Campinas 2026 (GDG Campinas), built the same way as [EloTech 2026](https://github.com/gdgcampinas/EloTech-Agibank): static HTML/CSS/JS, no build step, no framework, no backend, deployed via GitHub Pages from `docs/`.

## Stack (non-negotiable)

- Plain HTML/CSS/JS. Zero build, zero npm dependency. Fonts via Google Fonts CDN (Manrope + Public Sans).
- GitHub Pages source: `docs/` folder on `main` — pushing to `main` publishes directly, no CI.
- Working branch: `development`. Merge to `main` when ready to publish.

## File architecture (one responsibility per file, zero duplication)

```
docs/
  index.html              structure only, no logic
  css/styles.css           design tokens (oklch) + all visual rules
  js/
    data/
      schedule.js           PROD data (mock until line-up reveal)
      schedule.dev.js        DEV data (real, gitignored, local only)
      sponsors.js             PROD sponsors/partners by tier
    components/
      track-card.js          talk card + detail markup (track-agnostic)
      info-card.js            generic "before you come" card template
      sponsor-card.js          sponsor logo + tier markup
    features/
      agenda.js                legend, tabs, full schedule render
      live-status.js            resolveEventState() + createLiveStatus()
      talk-modal.js              generic modal + talk detail + galleries
      sponsors.js                mounts/hides the sponsors section
    app.js                    bootstrap: wires everything, ?demo=/?lineup= overrides
```

## Key design decision: zero per-track CSS

Every track-colored element (talk card, tab, legend item, modal detail,
"before you come" card) reads its color from `track.color` in
`schedule.js` and sets `--track-color` inline via JS. **No CSS rule
targets a track id** (no `.talk[data-track="ia"]{...}` style blocks).
Adding, renaming, or recoloring a track is a one-line change in
`TRACKS`, nothing to touch in `styles.css`.

Same principle applies to track count: `.talks` and `.tracks-legend`
grids use `repeat(var(--track-count), 1fr)`, set once from
`TRACKS.length` in `app.js`.

## Dev/prod pattern for sensitive data (line-up)

`docs/js/data/schedule.dev.js` holds real speaker data and is
gitignored — never committed before the public reveal.
`docs/index.html` tries to load it first; if it 404s (always the case
in production), it falls back to `schedule.js` (mock/"coming soon").

To reveal the real line-up: copy `schedule.dev.js` content into
`schedule.js`, commit, push. From reveal onward, keep both files
identical — always edit both together.

## Header hosts (co-hosts/sponsors)

`EVENT.hosts` in `schedule.js` is an array, not a fixed pair — the
header renders 1..N logos with an auto-generated "+" separator
(`renderBrand()` in `app.js`). Add entries there when partners are
confirmed; no HTML/CSS change needed.

## Sponsors section

`docs/js/data/sponsors.js` exports `SPONSORS`, a list of
`{ tier, elements: [{name, link, imageUrl}] }`. The section
(`js/features/sponsors.js`) hides itself entirely while empty. Fill in
tiers when confirmed.

## URL overrides (testing)

- `?demo=2026-11-14T09:50` (seconds optional) — simulates event time,
  advances in real time from that offset (never freezes).
- `?lineup=1` — forces the line-up to show even before
  `EVENT.lineupRevealed` is true.

## Deploy checklist

1. Edit files.
2. `node --check` every changed `.js` file.
3. Bump `?v=N` on every `<link>`/`<script>` in `index.html` whose file
   content changed.
4. Test locally (open `docs/index.html`, walk through `?demo=`
   transition points, check console for errors).
5. `git commit` (English, no AI co-author line).
6. `git push`.
7. Confirm live via `curl` before considering it done.

## TBD (fill in before the event)

- Event date, time window, venue, address (`EVENT` in schedule.js/.dev.js).
- Track names/rooms/MCs (`TRACKS`).
- Sponsors/partners (`sponsors.js`, `EVENT.hosts`).
- Parking/food images (`PARKING_IMAGES`/`FOOD_IMAGES` in `app.js`).
- `docs/assets/img/` (background, og-image) if we want the photo
  background EloTech had — currently a plain gradient, no image asset.
