# Frontier Watch — Cowork Handoff

Operating document for producing the weekly **Frontier Watch** briefing (AI × supply chain) in Cowork. Edition 01 (Week 27, compiled 2026-07-02) is the reference implementation; this doc + `pattern-state.json` carry everything needed to produce Edition 02+ with continuity.

---

## 1. Product spec

- **What:** single-file interactive HTML briefing, ~15-min read. Signals feed + cross-source pattern tracker + stack-mapped mimic board + obsolescence verdict + timeline + tiered sources.
- **Cadence:** weekly. Edition N covers the ISO week ending the compile date. Next due: **~Thu Jul 9, 2026 (Edition 02, Week 28)**.
- **Domains (fixed taxonomy):** Planning & Demand · Supply & Procurement · Manufacturing · Commercial & CRM · Data & Agent Stack. Theme colors are locked in the template.
- **Reader persona (explicit — this is a hard requirement):** supply chain professional, fluent in SC/business language (S&OP, MRP, WOS, BOM…), **novice on tech-stack jargon**. Every tech term must be either replaced with business language, glossed via the TERMS tooltip layer, or confined to the card's "Stack detail" line. Use this persona for the role-play verification step. *Background: Edition 01's first draft failed this — the role-play was run with a tech-fluent persona and jargon shipped. Do not repeat.*
- **Audience org stack (mimic actions must map to it):** Microsoft Fabric (Lakehouse/OneLake, Data Agents, notebooks) · Power BI (semantic models, DAX) · Power Query/M · Acumatica ERP ("Onematica" consolidated instance) · Power Automate. Business units: PSF and ROSE.

## 2. Folder layout (working directory)

```
frontier-watch/
├── HANDOFF.md              ← this file
├── pattern-state.json      ← cross-edition memory: read FIRST, update LAST
├── assertions.js           ← verification harness (see §6 note on hardcoded counts)
└── frontier-watch-e01.html ← Edition 01 (Rev B) = the live template
```

Each weekly run adds `frontier-watch-eNN.html` and rewrites `pattern-state.json`.

## 3. Weekly run procedure

**Step 0 — Read state.** Load `pattern-state.json`: prior pattern verdicts/strengths, watch items due, open mimic actions, and the signal registry (to reference, not repeat, prior coverage). Ask the user for status on open actions if convenient; otherwise mark `status: "unknown"` and carry forward.

**Step 1 — Research (~8–12 web searches).**
- One sweep per domain (5), one "this week" recency sweep, plus targeted follow-ups on every watch item due.
- Prefer primary/analyst sources; tier everything T1–T4 (see §5).
- **Corroboration rule:** `multi: true` only if the substance is independently reported/evidenced by ≥2 *unaffiliated* organizations. Check publisher families — separate trade titles under one publisher (e.g., BizClik: Procurement Magazine / Supply Chain Digital / Manufacturing Digital) count as ONE voice; flag this in the card when it happens.
- Vendor performance figures are always labeled as claims. Source discrepancies get named in the Method box, not silently resolved.

**Step 2 — Build.** Clone the previous edition's HTML; replace only:
- The data-layer `<script>` block (THEMES/TIERS/TERMS/SIGNALS/PATTERNS/MIMICS/TIMELINE). TERMS: keep existing entries, append new ones as new jargon appears.
- **Rev E template layers (Jul 3 — do not strip):** two reading REGISTERS, not just views: every signal carries analyst copy (`one`, `why`) AND executive copy (`xone`, `xwhy` — consequence/decision framing, zero mechanics; both ≤32-word one-liners, linted). The palette is bound to the view as the visual cue — Executive = warm ivory + emerald + champagne; Analyst = cool stone + jade + sage (green = brand, both views). View switch = single control in the sticky glass nav (`#topnav`); no separate palette toggle. Dark dossier masthead (`data-ed` ghost numeral — update per edition) + weekly PULSE STRIP under it fed by the `DELTA` object (rewrite each edition: prev, next, headline, items) with pattern `move:{dir:"new|up|down|flat",from,to}` chips computed from status_history. Hands-on content carries class `an-only` (hidden in exec); exec-only content carries `x-only`. PWA layer: `manifest.webmanifest`, `icons/`, `sw.js`, `feed.xml` (append new edition item below its marker each week), theme-color meta, safe-area insets. First-visit coach mark (`#coach`, localStorage `fw-coach`). Chart colors read CSS variables live via `V()`; never hardcode hex in chart configs.Masthead (edition #, week, compile date, headline thesis), hero takeaways (3, each pointing at a signal), verdict box, Method box (keep the labeling conventions text; refresh discrepancy notes).
- Target 12–16 signals; keep pattern IDs P1–P6 stable (retire/add only with a note in Method).

**Copy rules (asserted, not aspirational):**
- One-liners: business-language-first, ≤32 words (the harness lints this).
- Deep technical specifics (versions, spec items, API names) go in the signal's `tech` field → renders as the mono "Stack detail" line. Not in prose.
- Glossary decoration is automatic (first occurrence per card); headings/badges/Stack-detail are excluded by design.

**Step 3 — Verify (mandatory, webapp-craft Phase 2).** The `webapp-craft` skill governs the whole build — add it to the Cowork session. Run its `scripts/verify_artifact.py` with `assertions.js`, inspect desktop + mobile screenshots, and run the role-play walkthrough **as the §1 persona**. **Mobile/editorial checklist (added Jul 3 after misses):** check a 390px render for badge/pill wrapping, UI chips embedded in running prose (never allowed), safe-area/notch clearance of the fixed nav, block alignment, and 62ch reading measures. The app icon is the approved RADAR SWEEP mark — sweep arm in brand green catching signal dots (one champagne) on a gridded green-black tile; never redesign or recolor it without the user's sign-off. Zero assertion failures required; 3-iteration cap with known-issues disclosure.

**Step 4 — Update state.** Rewrite `pattern-state.json`: per pattern, record direction/strength changes and which confirmers/weakeners fired (each pattern lists falsifiers — actively check them, don't only collect confirmation). Append this edition to `status_history`. Update watch items (resolved/carried), mimic-action statuses, and append new signals to the registry.

**Step 5 — Deliver.** Edition file + a short delta report: new signals, pattern movements vs. last week, watch items resolved/opened. Keep it tight.

## 4. Data contract (per signal)

```
{ id:"S01", theme:"plan|supply|mfg|crm|stack", date:"YYYY-MM-DD",
  xone, xwhy,                     // EXECUTIVE register: one-liner (≤32 words) + 'what it means for us' — written separately from the analyst copy, business-consequence framing, no mechanics
  win:"week|june|ctx",            // recency badge (rename 'june' bucket per month)
  impact:1-5, adopt:1-5,          // EDITORIAL scores — labeled as judgment in UI
  multi:true|false,               // corroboration rule in §3
  title, one,                     // one ≤32 words, business language
  what, why, mimic, trend,        // prose blocks
  tech:"…",                       // optional Stack-detail line (mono)
  pats:["P1"],                    // pattern links
  sources:[{n,u,t:1-4}] }         // every source needs a live URL + tier
```
Signal codes restart per edition (S01…). Cross-edition identity lives in `pattern-state.json`'s registry.

**Scoring definitions:** impact = consequence for a mid-market supply chain org if the signal holds; adopt = how directly the §1 stack can adopt/mimic it today.

## 5. Source tiers

T1 analyst / peer-reviewed (Gartner, arXiv, MIT, Deloitte/MHI) · T2 primary vendor/project (PRs, project blogs, BusinessWire) · T3 trade & business press · T4 practitioner/specialist blogs. Monochrome ramp in UI; dedupe the master list by URL.

## 6. Verification harness note

`assertions.js` is fully generalized (Jul 3): the signal-count check asserts the §3 target range 12–16 and pattern count reads from `window.__FW` — **no per-edition edits needed**. It also asserts the Rev C view/palette contracts (exec hides `an-only` content; palette toggle restyles page and charts). Everything else (KPIs, chip counts, filter/search/sort/Esc contracts, glossary/tooltip contracts, Stack-detail counts, one-liner lint, source dedupe) adapts automatically.

## 7. Carried-over items for Edition 02 (also in pattern-state.json)

- **M5 (verify):** Onematica upgrade path/timeline to Acumatica 2026 R1 — ask the user; it gates several build-vs-wait calls.
- **Jul 28:** MCP 2026-07-28 spec final lands — confirm it shipped as specced (P5 confirmer).
- **Q2 check:** SAP Outbound Task Orchestration Agent GA (P1 confirmer/falsifier).
- **Rolling:** Fabric planning GA rollout completion; any ERP/planning vendor announcing outcome pricing (P3 confirmer); Acumatica AI Assistant GA-vs-early-access discrepancy.
- **M1–M4, M6:** proposed, status unknown — ask.

## 8. Kickoff prompt (paste into Cowork)

> Produce Frontier Watch Edition 02 (Week 28, 2026) in this folder, following HANDOFF.md exactly. Read pattern-state.json first. The webapp-craft skill is mandatory end-to-end, including the full verification loop; run the role-play as the reader persona defined in HANDOFF §1 (SC-fluent, tech-novice). Clone frontier-watch-e01.html as the template and swap the data layer. Update assertions.js's two hardcoded counts. Finish by rewriting pattern-state.json and giving me a delta report vs. Edition 01.

## 9. Known limitations (honest scope)

- Research quality is the same web search underneath — Cowork changes the harness (file state, unattended runs), not the sourcing.
- Pattern strength = count of unaffiliated orgs in *this product's* source set; it is an editorial evidence tally, not a survey statistic.
- The glossary decorator matches first occurrence per card via regex; a term appearing only inside a heading gets no tooltip (headings are excluded by design).
