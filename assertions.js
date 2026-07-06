/* Frontier Watch verification harness (run via webapp-craft scripts/verify_artifact.py --assertions)
   GENERALIZED (was edition-specific): signal count now asserts the HANDOFF §3 target range 12-16,
   pattern count reads from window.__FW. No per-edition edits needed. */
(async () => {
  const R = [];
  const t = (name, pass, detail="") => R.push({name, pass: !!pass, detail: String(detail)});
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const FW = window.__FW;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------- Data integrity ----------
  t("data layer exposed", !!FW, FW ? "ok" : "window.__FW missing");
  if (!FW) return R;

  // Rev C: run the full harness in analyst view (everything visible)
  if (FW.setView) { FW.setView("analyst"); await sleep(60); }

  // HANDOFF §3 target: 12-18 signals per edition (widened Jul 3 for taxonomy v2's six categories)
  t("signal count in 12-18 target range", FW.SIGNALS.length >= 12 && FW.SIGNALS.length <= 18, FW.SIGNALS.length);
  t("rendered cards == signal count", $$("#feed details.sig").length === FW.SIGNALS.length,
    $$("#feed details.sig").length + " vs " + FW.SIGNALS.length);

  // theme counts data vs chips
  const themeKeys = Object.keys(FW.THEMES);
  const dataCounts = Object.fromEntries(themeKeys.map(k => [k, FW.SIGNALS.filter(s => s.theme === k).length]));
  t("theme counts sum to total", Object.values(dataCounts).reduce((a,b)=>a+b,0) === FW.SIGNALS.length,
    JSON.stringify(dataCounts));
  const chipOK = themeKeys.every(k => {
    const tab = $(`#ribbon .stage-tab[data-theme="${k}"] .ct`);
    return tab && parseInt(tab.textContent) === dataCounts[k];
  });
  t("ribbon tab counts match data", chipOK);

  // Rev G: taxonomy v2 contract — five SCOR stages + infrastructure, locked keys
  t("taxonomy = plan,source,make,deliver,sell,infra", JSON.stringify(themeKeys) === JSON.stringify(["plan","source","make","deliver","sell","infra"]), themeKeys.join(","));
  t("infrastructure flagged as cross-cutting", FW.THEMES.infra && FW.THEMES.infra.infra === true);
  t("ribbon renders all + 5 stages + infra band", $$("#ribbon .stage-tab").length === 7 && !!$("#ribbon .infra-band"), $$("#ribbon .stage-tab").length);

  // KPI strip recomputation
  const kpiVals = $$("#kpis .kpi .v").map(e => e.textContent.trim());
  const multi = FW.SIGNALS.filter(s => s.multi).length;
  const hard = FW.PATTERNS.filter(p => p.dir === "hard").length;
  t("KPI[0] == signal count", kpiVals[0] === String(FW.SIGNALS.length), kpiVals[0]);
  t("KPI[1] == multi-source count", kpiVals[1] === String(multi), kpiVals[1] + " vs " + multi);
  t("KPI[2] == hardening/total patterns", kpiVals[2].replace(/\s/g,"") === hard + "/" + FW.PATTERNS.length, kpiVals[2]);
  t("KPI[3] == mimic count", kpiVals[3] === String(FW.MIMICS.length), kpiVals[3]);

  // Every signal has required fields + valid scores + >=1 source with URL
  const bad = FW.SIGNALS.filter(s =>
    !(s.id && s.title && s.one && s.what && s.why && s.mimic && s.trend) ||
    !(s.impact>=1 && s.impact<=5 && s.adopt>=1 && s.adopt<=5) ||
    !(Array.isArray(s.sources) && s.sources.length>0 && s.sources.every(x => /^https?:\/\//.test(x.u) && [1,2,3,4].includes(x.t)))
  ).map(s=>s.id);
  t("all signals complete (fields, 1-5 scores, tiered URLs)", bad.length===0, bad.join(",")||"ok");

  // multi flag consistency: multi=true requires >=2 distinct source hostnames
  const host = u => new URL(u).hostname.replace(/^www\./,"");
  const multiBad = FW.SIGNALS.filter(s => s.multi && new Set(s.sources.map(x=>host(x.u))).size < 2).map(s=>s.id);
  t("multi-source flag backed by >=2 hostnames", multiBad.length===0, multiBad.join(",")||"ok");

  // Source list dedupe count matches displayed total
  const totText = $("#srcTotal").textContent;
  t("source total label == computed dedupe", totText.includes(String(FW.allSrcCount)), totText);
  t("source list length == dedupe count", $$("#srcList li").length === FW.allSrcCount,
    $$("#srcList li").length + " vs " + FW.allSrcCount);
  const tierSum = Object.values(FW.tierCounts).reduce((a,b)=>a+b,0);
  t("tier counts sum == source total", tierSum === FW.allSrcCount, tierSum);

  // Pattern cards rendered, each with orgs count shown
  t("pattern cards rendered == data", $$("#patternGrid .pattern").length === FW.PATTERNS.length, $$("#patternGrid .pattern").length);
  const pOK = FW.PATTERNS.every(p => {
    const el = document.getElementById(p.id);
    return el && el.textContent.includes(p.orgs.length + " independent orgs");
  });
  t("pattern strength labels match org counts", pOK);

  // Mimic table rows + every 'from' link points to a real card
  t("mimic rows == data", $$("#mimicTable tbody tr").length === FW.MIMICS.length);
  const fromOK = FW.MIMICS.every(m => m.from.split("·").map(x=>x.trim()).every(id => FW.SIGNALS.some(s=>s.id===id)));
  t("all mimic 'from' ids exist in signals", fromOK);

  // Timeline items
  t("timeline items rendered", $$("#timeline .tl-item").length === FW.TIMELINE.length);

  // Charts exist and scatter has one point per signal
  const charts = Object.values(Chart.instances || {});
  t("3 charts instantiated", charts.length === 3, charts.length);
  const scatter = charts.find(c => c.config.type === "scatter");
  const scatterPts = scatter ? scatter.data.datasets.reduce((a,d)=>a+d.data.length,0) : -1;
  t("scatter points == signal count", scatterPts === FW.SIGNALS.length, scatterPts);

  // ---------- Interaction contracts ----------
  // Filter via ribbon: infra tab -> card count == data count for infra
  FW.setTheme("infra"); await sleep(60);
  t("filter[infra] shows correct card count", $$("#feed details.sig").length === dataCounts.infra,
    $$("#feed details.sig").length + " vs " + dataCounts.infra);
  t("filter[infra] all cards themed infra", $$("#feed details.sig").every(d=>d.dataset.theme==="infra"));
  t("stage focus line renders on selection", (()=>{ const f=$("#stageFocus"); return f && !f.hidden && /signal/.test(f.textContent); })());

  // legacy key mapping (old shared links must not break)
  FW.setTheme("stack"); await sleep(40);
  t("legacy key 'stack' maps to 'infra'", FW.state.theme === "infra", FW.state.theme);
  FW.setTheme("mfg"); await sleep(40);
  t("legacy key 'mfg' maps to 'make'", FW.state.theme === "make", FW.state.theme);

  FW.setTheme("all"); await sleep(60);
  t("filter[all] restores full feed + hides stage focus", $$("#feed details.sig").length === FW.SIGNALS.length && $("#stageFocus").hidden);

  // Search: a term unique to S12 ("stateless") should narrow the feed and include S12
  const sb = $("#searchBox");
  sb.value = "stateless"; sb.dispatchEvent(new Event("input", {bubbles:true})); await sleep(60);
  const searchIds = $$("#feed details.sig").map(d=>d.dataset.id);
  t("search 'stateless' finds S12", searchIds.includes("S12") && searchIds.length < FW.SIGNALS.length, searchIds.join(","));
  sb.value = ""; sb.dispatchEvent(new Event("input", {bubbles:true})); await sleep(60);

  // Search empty state
  sb.value = "zzzznotfound"; sb.dispatchEvent(new Event("input", {bubbles:true})); await sleep(60);
  t("empty search shows empty state", !!$("#feed .empty"));
  sb.value = ""; sb.dispatchEvent(new Event("input", {bubbles:true})); await sleep(60);

  // Sort by date -> first card is the newest date
  const sel = $("#sortSel"); sel.value = "date"; sel.dispatchEvent(new Event("change", {bubbles:true})); await sleep(60);
  const newest = FW.SIGNALS.slice().sort((a,b)=>b.date.localeCompare(a.date))[0].id;
  t("sort[newest] puts latest signal first", $$("#feed details.sig")[0].dataset.id === newest,
    $$("#feed details.sig")[0].dataset.id + " vs " + newest);
  sel.value = "impact"; sel.dispatchEvent(new Event("change", {bubbles:true})); await sleep(60);

  // Sort by impact -> first card has max impact
  const maxImp = Math.max(...FW.SIGNALS.map(s=>s.impact));
  const firstId = $$("#feed details.sig")[0].dataset.id;
  t("sort[impact] first card has max impact", FW.SIGNALS.find(s=>s.id===firstId).impact === maxImp, firstId);

  // Expand all / collapse all / Escape
  $("#expandAll").click(); await sleep(60);
  t("expand-all opens every card", $$("#feed details[open]").length === FW.SIGNALS.length);
  document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await sleep(60);
  t("Escape collapses all cards", $$("#feed details[open]").length === 0);

  // Cannabis lens: conditional contract — section exists iff tagged signals exist
  const cannTagged = FW.SIGNALS.some(x=>x.cann);
  t("cannabis lens renders iff tagged signals exist", cannTagged ? !!$("#cannabis") : !$("#cannabis"), "tagged=" + cannTagged);
  t("cannabis nav link matches section presence", cannTagged ? !!$("#navCann") : !$("#navCann"));

  // openCard navigates + opens (from a filtered state, proving filter reset)
  FW.setTheme("sell"); await sleep(60);
  FW.openCard("S09", false); await sleep(80);
  const c9 = document.getElementById("card-S09");
  t("openCard resets filter and opens target", !!c9 && c9.open && FW.state.theme === "all",
    "theme=" + FW.state.theme + " open=" + (c9 && c9.open));
  document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true}));

  // No horizontal overflow (desktop run)
  t("no horizontal scroll", document.documentElement.scrollWidth <= window.innerWidth + 1,
    document.documentElement.scrollWidth + " vs " + window.innerWidth);

  // ---------- Rev B: glossary + Stack detail ----------
  t("TERMS exposed (>=15 entries)", FW.TERMS && FW.TERMS.length >= 15, FW.TERMS ? FW.TERMS.length : "missing");

  const termSpans = $$(".term");
  t("glossary decorations present (>=25 across page)", termSpans.length >= 25, termSpans.length);

  // tooltip shows on click, hides on Escape
  const tipEl = document.getElementById("tip");
  t("tooltip element exists", !!tipEl);
  const probeTerm = $("#feed .term") || termSpans[0];
  probeTerm.click(); await sleep(60);
  t("tooltip shows on term click, with definition", tipEl.style.display === "block" && tipEl.textContent.length > 15,
    (tipEl.textContent || "").slice(0, 40));
  document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await sleep(40);
  t("Escape hides tooltip", tipEl.style.display === "none");

  // term click inside a collapsed summary must NOT open the card
  const cardTermSummary = $$("#feed details.sig").find(d => d.querySelector("summary .term"));
  if (cardTermSummary) {
    cardTermSummary.open = false;
    cardTermSummary.querySelector("summary .term").click(); await sleep(60);
    t("term click inside summary doesn't toggle card", cardTermSummary.open === false && tipEl.style.display === "block");
    document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await sleep(30);
  } else {
    t("term click inside summary doesn't toggle card", true, "no summary-level terms; skipped");
  }

  // Stack-detail cells: rendered count == signals carrying a tech field
  $("#expandAll").click(); await sleep(60);
  const techData = FW.SIGNALS.filter(s => s.tech).length;
  t("Stack-detail cells == signals with tech field", $$("#feed .tech-cell").length === techData,
    $$("#feed .tech-cell").length + " vs " + techData);
  document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await sleep(40);

  // copy tightness lint: every one-liner <= 32 words
  const longOnes = FW.SIGNALS.filter(s => s.one.split(/\s+/).length > 32).map(s => s.id);
  t("one-liners <= 32 words", longOnes.length === 0, longOnes.join(",") || "ok");

  // decoration must survive a re-render (filter round-trip)
  FW.setTheme("stack"); await sleep(60);
  t("gloss survives re-render (terms in filtered feed)", $$("#feed .term").length > 0, $$("#feed .term").length);
  FW.setTheme("all"); await sleep(60);

  // ---------- Rev E: dual-register views, view-bound palettes, pulse, PWA ----------
  if (FW.setView) {
    const hid = el => !el || getComputedStyle(el).display === "none";

    // exec register completeness + lint
    const noX = FW.SIGNALS.filter(x => !(x.xone && x.xwhy)).map(x=>x.id);
    t("all signals carry exec register (xone+xwhy)", noX.length===0, noX.join(",")||"ok");
    const longX = FW.SIGNALS.filter(x => x.xone && x.xone.split(/\s+/).length > 32).map(x=>x.id);
    t("exec one-liners <= 32 words", longX.length===0, longX.join(",")||"ok");

    // view switch = content register + palette cue
    FW.setView("exec"); await sleep(80);
    t("exec view set on root", document.documentElement.dataset.view === "exec");
    const accExec = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const bgExec = getComputedStyle(document.body).backgroundColor;
    t("exec hides mimic board section", hid($("#mimic")));
    t("exec hides method box", hid($(".method")));
    t("exec hides 4th KPI (mimic count)", hid($("#kpis .kpi.an-only")));
    const c1 = $("#feed details.sig .sig-one");
    t("exec shows exec one-liner, hides analyst one",
      c1 && !hid(c1.querySelector(".x-only")) && hid(c1.querySelector(".an-only")));
    $("#expandAll").click(); await sleep(60);
    t("exec hides per-card mimic + stack-detail cells", hid($("#feed .mimic-cell")) && hid($("#feed .tech-cell")));
    t("exec shows 'what it means for us' body block", (()=>{ const b=$("#feed .sig-body .x-only"); return b && !hid(b); })());
    document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape", bubbles:true})); await sleep(40);

    FW.setView("analyst"); await sleep(80);
    const accAn = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    const bgAn = getComputedStyle(document.body).backgroundColor;
    t("analyst restores mimic board + method box", !hid($("#mimic")) && !hid($(".method")));
    t("analyst shows analyst one-liner, hides exec one", (()=>{ const c=$("#feed details.sig .sig-one"); return c && hid(c.querySelector(".x-only")) && !hid(c.querySelector(".an-only")); })());
    t("palette is bound to view (warm exec vs cool analyst)", accExec !== accAn || bgExec !== bgAn, accExec+" vs "+accAn);
    t("green brand accent in both views", accExec === "#1e6b4e" && accAn === "#26735a", accExec + " | " + accAn);
    t("view choice persisted", (()=>{ try { return localStorage.getItem("fw-view") === "analyst"; } catch(e){ return true; } })());

    // pulse strip
    t("weekly pulse strip rendered", (()=>{ const el=$("#pulse .pulse-in"); return el && el.children.length >= 3 && /NEXT EDITION/i.test(el.textContent); })());
    t("pattern move chips rendered", $$("#patternGrid .p-move").length === FW.PATTERNS.length, $$("#patternGrid .p-move").length);

    // PWA / platform layer
    t("manifest linked", !!document.querySelector('link[rel="manifest"]'));
    t("apple-touch-icon linked", !!document.querySelector('link[rel="apple-touch-icon"]'));
    t("theme-color meta present", !!document.querySelector('meta[name="theme-color"]'));
    t("RSS alternate linked", !!document.querySelector('link[rel="alternate"][type="application/rss+xml"]'));
    t("sticky glass nav present with view controls", !!$("#topnav") && getComputedStyle($("#topnav")).position === "fixed" && $$('#topnav [data-seg="view"] button').length === 2);

    // Editorial + platform governance (added after Rev E misses — keep permanently)
    t("no UI pill inside running prose (sec-sub)", !document.querySelector(".sec-sub .badge"));
    t("badges never wrap mid-word", $$(".sig-badges .badge").every(b => getComputedStyle(b).whiteSpace === "nowrap"));
    t("viewport-fit=cover set (notch clearance)", /viewport-fit=cover/.test((document.querySelector('meta[name="viewport"]')||{content:""}).content));
    t("nav + masthead use safe-area insets", (()=>{ const css = [...document.querySelectorAll("style")].map(x=>x.textContent).join(""); return (css.match(/safe-area-inset-top/g)||[]).length >= 3; })());
    t("single data accent: meters use brand green", (()=>{ const m=$(".meter i.on"); return m && getComputedStyle(m).backgroundColor === "rgb(63, 163, 124)"; })());
    t("social share metas present (og:title/og:image/description)", !!document.querySelector('meta[property="og:title"]') && !!document.querySelector('meta[property="og:image"]') && !!document.querySelector('meta[name="description"]'));
  } else {
    t("view API exposed", false, "FW.setView missing");
  }

  return R;
})()
