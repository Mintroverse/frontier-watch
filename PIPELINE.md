# Frontier Watch — Publishing Pipeline

Set up 2026-07-03. Fully automated weekly production + publishing of the Frontier Watch briefing.

## Live site

- **URL (share this):** https://mintroverse.github.io/frontier-watch/
- Root always shows the **latest edition**; `archive.html` lists all editions; `feed.xml` is the RSS feed.
- Repo: https://github.com/Mintroverse/frontier-watch (public). The repo, not the local folder, is the source of truth for automated runs.

## Weekly automation

- **Scheduled task:** `frontier-watch-weekly`, Thursdays ~6:00 AM local (Claude desktop app must be open; missed slots run on next launch). Full prompt: `..\Scheduled\frontier-watch-weekly\SKILL.md`.
- Run shape: clone repo → read pattern-state.json → research (8–12 searches) → build Edition N from index.html template, **writing both content registers** → webapp-craft verification (62-check harness, both views, dual persona role-plays) → update index/editions/archive/feed/state → push `main` + `gh-pages` → verify live → delta report.
- **Publish gate:** failing after 3 fix iterations → `draft-eNN` branch + notification, never live.
- **Token:** fine-grained PAT scoped to this repo, embedded in the task SKILL.md (workaround — CI secrets aren't available since the build runs in Claude). Expiry stops publishing with a clear notification; rotate in GitHub → Developer settings and update the SKILL.md line.

## Rev E — dual registers, habit layer, PWA (2026-07-03, current)

Built from the multi-persona audit (FRONTIER-WATCH-AUDIT.md in the local folder). (1) **Two content registers**: every signal carries separately-written executive copy (`xone`/`xwhy`, consequence + decision framing) and analyst copy (`one`/`what`/`why`/`mimic`/`tech`); the weekly run researches once and writes twice. (2) **Palette bound to view** as the visual cue — Executive = warm ivory/emerald/champagne; Analyst = cool stone/jade/sage; green is the brand accent in both. One control in the sticky glass nav; no palette toggle. (3) **Habit layer** — weekly pulse strip under the masthead (`DELTA` object), pattern movement chips (`move` field from status_history), next-edition marker, RSS feed. (4) **iOS/PWA layer** — FW monogram icon set (`icons/`), `manifest.webmanifest` (standalone, dark), apple-touch-icon, theme-color, safe-area insets, network-first `sw.js` for offline re-read and app-like launch from the iPhone home screen. (5) First-visit coach mark explaining the two reading modes. Harness = 62 checks including register, palette-binding, pulse, and PWA contracts.

## Earlier revisions (superseded)

- **Rev D:** editorial-luxury system — dark dossier masthead + ghost numeral, sticky glass nav, de-boxed numbered sections, Newsreader/Inter/IBM Plex Mono type, dark footer bookend.
- **Rev C:** first luxury-light pass — gold/graphite palettes, floating glass control bar, exec/analyst element hiding, Fraunces type (rejected: quirky glyphs).
- **Rev B (pre-pipeline):** business-language copy pass, glossary tooltips, Stack-detail lines.
- Harness generalized 2026-07-03: signal count asserts the 12–16 range; pattern count reads from `window.__FW` — no per-edition edits.

## Manual redeploy (if ever needed)

```bash
git clone https://x-access-token:<TOKEN>@github.com/Mintroverse/frontier-watch.git
# ...edit files...
git add -A && git commit -m "manual update"
git push origin main && git push origin main:gh-pages --force-with-lease
```
