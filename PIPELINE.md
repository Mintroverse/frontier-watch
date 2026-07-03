# Frontier Watch — Publishing Pipeline

Set up 2026-07-03. Fully automated weekly production + publishing of the Frontier Watch briefing.

## Live site

- **URL (share this):** https://mintroverse.github.io/frontier-watch/
- Root always shows the **latest edition**; `archive.html` lists all editions (linked from every edition's footer: "All editions →").
- Repo: https://github.com/Mintroverse/frontier-watch (public)

## Architecture

```
GitHub repo (source of truth)          GitHub Pages (published site)
├── index.html      ← latest edition   branch: gh-pages (mirror of main)
├── archive.html    ← edition list     URL: mintroverse.github.io/frontier-watch
├── editions/frontier-watch-eNN.html
├── state/pattern-state.json  ← cross-edition memory (read FIRST, rewritten LAST each run)
├── assertions.js   ← verification harness (GENERALIZED — no per-edition edits needed)
├── HANDOFF.md      ← operating procedure
└── PIPELINE.md     ← this file
```

The **repo, not this local folder, is the source of truth** for automated runs — they clone it fresh each week. This folder is a working copy; the weekly run copies new editions + state back here when accessible (best effort).

## Weekly automation

- **Scheduled task:** `frontier-watch-weekly`, Thursdays ~6:00 AM local, managed in the Claude app sidebar ("Scheduled" section). Full run prompt: `..\Scheduled\frontier-watch-weekly\SKILL.md`.
- **What it does:** clone repo → read pattern-state.json → research (8–12 searches per HANDOFF §3) → build Edition N from previous edition template → webapp-craft verification loop (assertion harness, desktop+mobile screenshots, SC-fluent/tech-novice persona role-play) → update index/archive/editions/state → push to `main` + `gh-pages` → verify live URL → delta report notification.
- **Publish gate:** an edition that still fails assertions after 3 fix iterations is NOT published — it goes to a `draft-eNN` branch and you get notified instead.

## Constraints & known limitations (read once)

1. **App must be open.** Scheduled tasks run through the Claude desktop app. If it's closed Thursday 6 AM, the run fires on next app launch instead. There is no server-side execution.
2. **Token in task file (workaround, not best practice).** The GitHub publish token is embedded in the scheduled task's SKILL.md so unattended runs can push. Mitigation: fine-grained PAT scoped to this one public repo (Contents + Pages) — worst case is someone with access to this machine pushing to the briefing site. Best practice (CI-held secrets) isn't available because the build runs in Claude, not GitHub Actions.
3. **Token expiry stops publishing.** If the token was created with 90-day expiry, publishing breaks ~early Oct 2026 with a clear "token expired" notification. Rotate: GitHub → Settings → Developer settings → Fine-grained tokens → regenerate for repo `frontier-watch` (Contents: RW, Pages: RW) → update the token line in `..\Scheduled\frontier-watch-weekly\SKILL.md`.
4. **First run may pause for permissions.** Tool approvals are stored per task after the first run. If the Jul 9 run pauses on permission prompts, approve them once — subsequent weeks run clean. (Alternatively "Run now" any time you're ready to pre-approve.)
5. **Pages source is the `gh-pages` branch** (auto-enabled via branch push; the token can't call the Pages admin API). `main` and `gh-pages` are kept identical by the weekly run.

## Manual redeploy (if ever needed)

```bash
git clone https://x-access-token:<TOKEN>@github.com/Mintroverse/frontier-watch.git
# ...edit files...
git add -A && git commit -m "manual update"
git push origin main && git push origin main:gh-pages --force-with-lease
```

## Changes made to handoff assets (2026-07-03)

- `assertions.js` generalized per HANDOFF §6 option: signal-count check now asserts the 12–16 target range and the pattern check reads from `window.__FW` — removes the per-edition manual edit entirely.
- Deployed edition copies get an injected "All editions →" footer link (index → `archive.html`, archived copies → `../archive.html`). The canonical `frontier-watch-e01.html` in this folder is untouched.
