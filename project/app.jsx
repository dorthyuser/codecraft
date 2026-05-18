/* Auro Heal — top-level app */
const { useState: useAS, useMemo: useAM } = React;

const DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "teal",
  "density": "comfortable",
  "envEmphasis": "cards"
}/*EDITMODE-END*/;

const ACCENT_MAP = {
  teal:   { hex: "#1d8f8c", d: "oklch(0.40 0.09 178)", m: "oklch(0.62 0.10 178)", s: "oklch(0.92 0.04 178)" },
  indigo: { hex: "#4f5cc7", d: "oklch(0.42 0.13 270)", m: "oklch(0.58 0.14 270)", s: "oklch(0.93 0.04 270)" },
  lime:   { hex: "#3aa84f", d: "oklch(0.45 0.13 140)", m: "oklch(0.65 0.16 140)", s: "oklch(0.93 0.06 140)" },
  coral:  { hex: "#d0623f", d: "oklch(0.45 0.14 32)",  m: "oklch(0.66 0.16 32)",  s: "oklch(0.93 0.05 32)" },
};
const accentHex = (k) => (ACCENT_MAP[k] || ACCENT_MAP.teal).hex;
const hexToAccent = (hex) => {
  const e = Object.entries(ACCENT_MAP).find(([, v]) => v.hex.toLowerCase() === hex.toLowerCase());
  return e ? e[0] : "teal";
};

function Sidebar({ page, onNav, errorCount, fixedCount }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div>
          <div className="brand-name">Auro Heal</div>
          <div className="brand-sub">AI2DEV · v0.4</div>
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-group-label">Workspace</div>
        <button className={`nav-item ${page === "dashboard" ? "active" : ""}`} onClick={() => onNav("dashboard")}>
          <Icon.dashboard className="nav-icon" />
          Dashboard
          <span className="nav-count">{errorCount}</span>
        </button>
        <button className={`nav-item ${page === "fixed" ? "active" : ""}`} onClick={() => onNav("fixed")}>
          <Icon.fixed className="nav-icon" />
          Fixed apps
          <span className="nav-count">{fixedCount}</span>
        </button>
        <button className="nav-item">
          <Icon.pulse className="nav-icon" />
          Live logs
        </button>
        <button className="nav-item">
          <Icon.bell className="nav-icon" />
          Alerts
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-group-label">Account</div>
        <button className="nav-item">
          <Icon.settings className="nav-icon" />
          Settings
        </button>
      </div>

      <div className="sidebar-foot">
        <div className="foot-avatar">RR</div>
        <div>
          <div style={{ color: "var(--ink)", fontWeight: 600 }}>Raj R.</div>
          <div className="tag-mono" style={{ fontSize: 10 }}>SRE · auro.dev</div>
        </div>
      </div>
    </aside>
  );
}

function App() {
  const data = window.AURO_DATA;
  const [tweaks, setTweak] = useTweaks(DEFAULTS);
  const [page, setPage] = useAS("dashboard");
  const [modalApp, setModalApp] = useAS(null);
  const [errorApps, setErrorApps] = useAS(data.apps);
  const [fixed, setFixed] = useAS(data.fixed);

  // accent override
  React.useEffect(() => {
    const c = ACCENT_MAP[tweaks.accent] || ACCENT_MAP.teal;
    document.documentElement.style.setProperty("--teal-deep", c.d);
    document.documentElement.style.setProperty("--teal", c.m);
    document.documentElement.style.setProperty("--teal-soft", c.s);
  }, [tweaks.accent]);

  // density
  React.useEffect(() => {
    document.body.classList.toggle("density-compact", tweaks.density === "compact");
  }, [tweaks.density]);

  const handlePickApp = (app) => setModalApp(app);
  const handleClose = () => setModalApp(null);
  const handleFixed = (rec) => {
    // remove from error list, add to fixed list at top
    setErrorApps((xs) => xs.filter((a) => a.name !== rec.app));
    setFixed((xs) => [{ ...rec, id: "fix-" + Date.now() }, ...xs]);
    setModalApp(null);
    setPage("fixed");
  };
  const handleRefix = (item) => {
    // synthesize an app entry for the modal
    setModalApp({
      id: "refix-" + item.id,
      name: item.app,
      env: item.env,
      lang: "—",
      severity: "medium",
      occurrences: 1,
      lastSeen: "now",
      errorType: item.errorType,
      error: `Previously fixed: ${item.summary}\n  commit ${item.commit} on ${item.branch}`,
      logExcerpt: [
        `[2026-05-17 09:00:00] INFO  re-fix requested by user`,
        `[2026-05-17 09:00:00] WARN  prior patch did not fully resolve issue`,
      ],
      repo: item.repo,
      branch: item.branch,
    });
  };

  // Composite data for dashboard with current error apps
  const dashData = useAM(() => ({ ...data, apps: errorApps }), [data, errorApps]);

  return (
    <div className="app">
      <Sidebar
        page={page}
        onNav={setPage}
        errorCount={errorApps.length}
        fixedCount={fixed.length}
      />
      <main className="main">
        {page === "dashboard" && <Dashboard data={dashData} onPickApp={handlePickApp} envEmphasis={tweaks.envEmphasis} />}
        {page === "fixed"     && <FixedApps items={fixed} onRefix={handleRefix} />}
      </main>

      {modalApp && (
        <FixFlow app={modalApp} onClose={handleClose} onFixed={handleFixed} />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Accent">
          <TweakColor
            label="Color"
            value={accentHex(tweaks.accent)}
            options={["#1d8f8c", "#4f5cc7", "#3aa84f", "#d0623f"]}
            onChange={(hex) => setTweak("accent", hexToAccent(hex))}
          />
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio
            label="Density"
            value={tweaks.density}
            options={[{ label: "Cozy", value: "comfortable" }, { label: "Compact", value: "compact" }]}
            onChange={(v) => setTweak("density", v)}
          />
          <TweakRadio
            label="Env style"
            value={tweaks.envEmphasis}
            options={[{ label: "Cards", value: "cards" }, { label: "Strip", value: "strip" }]}
            onChange={(v) => setTweak("envEmphasis", v)}
          />
        </TweakSection>
        <TweakSection label="Actions">
          <TweakButton
            label="Reset demo data"
            onClick={() => { setErrorApps(data.apps); setFixed(data.fixed); }}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
