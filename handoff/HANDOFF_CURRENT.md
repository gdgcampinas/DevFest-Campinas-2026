# Handoff — Current State

**Last updated:** 2026-08-19

## Status

Initial scaffold done on `development` branch, mirroring the EloTech
2026 architecture (see [project-docs/PROJECT_CONTEXT.md](../project-docs/PROJECT_CONTEXT.md)).
Site is functional with placeholder/TBD data — nothing real published yet.

## Done

- Full file structure under `docs/` (GitHub Pages source), modular by
  feature: `data/`, `components/`, `features/`, `app.js`, `css/`.
- Zero per-track CSS: colors and grid sizing are fully data-driven
  (`track.color`, `--track-count`), so track count/names/colors change
  in one place (`schedule.js`) with no CSS edits.
- New: `sponsors.js` (data) + `sponsor-card.js` + `features/sponsors.js`
  — sponsor/partner section by tier, hides itself while empty. EloTech
  didn't have this; added based on 2018 DevFest reference (tiered
  sponsor grid).
- New: `EVENT.hosts` array — header supports 1..N co-host/sponsor
  logos instead of the hardcoded 2-logo "+" layout EloTech had.
- New: wordmark rendered as text from `EVENT.name`, not an image asset
  — no wordmark.png needed per event.
- `.gitignore` covers `docs/js/data/schedule.dev.js`.
- All `.js` files pass `node --check`.

## Not done yet / TBD

- Real event date, time, venue, address.
- Real track names/rooms/MCs (currently "a definir" placeholders).
- Real line-up (`schedule.dev.js` — gitignored, must be filled locally
  when speakers are confirmed).
- Sponsors/partners data (`sponsors.js` is `[]`).
- Parking/food images and copy for "Antes de vir" section.
- Background image / og-image (currently plain gradient, no bg.jpg).
- Browser smoke test of the scaffold (pending — do before first push).
- No commit/push yet — waiting for smoke test to pass first.

## Next steps

1. Open `docs/index.html` locally, click through `?demo=` transition
   points (before/live/after), check console for errors.
2. Commit and push `development` branch.
3. Fill in real event details as they're confirmed (see TBD list in
   PROJECT_CONTEXT.md).
