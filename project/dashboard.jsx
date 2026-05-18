/* Auro Heal — Dashboard page (environments + apps with errors) */
const { useState: useStateDash, useMemo: useMemoDash } = React;

function EnvCard({ env }) {
  return (
    <div className="env-card" data-env={env.id} data-status={env.status}>
      <div className="env-head">
        <div className="env-logo">{env.name.slice(0, 3).toUpperCase()}</div>
        <div>
          <div className="env-name">{env.name}</div>
          <div className="env-kind">{env.kind}</div>
        </div>
        <div className="env-pulse">
          <span className="pulse-dot" />
          {env.status}
        </div>
      </div>

      <div className="env-stats">
        <div className="env-stat">
          <div className="v">{env.instances}</div>
          <div className="l">Instances</div>
        </div>
        <div className={`env-stat ${env.errors > 0 ? "alert" : ""}`}>
          <div className="v">{env.errors}</div>
          <div className="l">Active errors</div>
        </div>
      </div>

      <div>
        <div className="health-bar"><div className="health-fill" style={{ width: env.health + "%" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span className="tag-mono">Health</span>
          <span className="tag-mono" style={{ color: "var(--ink-soft)", fontWeight: 600 }}>{env.health}%</span>
        </div>
      </div>

      <div className="env-region">{env.region}</div>
    </div>
  );
}

function Dashboard({ data, onPickApp, envEmphasis = "cards" }) {
  const [filter, setFilter] = useStateDash("all");
  const [query, setQuery] = useStateDash("");

  const apps = useMemoDash(() => {
    return data.apps.filter((a) => {
      if (filter !== "all" && a.env !== filter) return false;
      if (query && !a.name.includes(query.toLowerCase()) && !a.errorType.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [filter, query, data.apps]);

  const totalErrors = data.environments.reduce((n, e) => n + e.errors, 0);
  const totalInstances = data.environments.reduce((n, e) => n + e.instances, 0);

  return (
    <div data-screen-label="01 Dashboard">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Operations · Live</div>
          <h1 className="page-title">Self-heal console</h1>
          <p className="page-sub">Auro inspects logs across your environments and proposes patches for the LLM to apply.</p>
        </div>
        <div className="head-stats">
          <div className="stat"><div className="stat-val">{totalInstances}</div><div className="stat-lbl">Instances watched</div></div>
          <div className="stat alert"><div className="stat-val">{totalErrors}</div><div className="stat-lbl">Open errors</div></div>
          <div className="stat good"><div className="stat-val">128</div><div className="stat-lbl">Healed · 30d</div></div>
        </div>
      </div>

      <div className="banner">
        <span className="b-dot" />
        Auro is ingesting <span className="tag-mono" style={{ color: "var(--ink)" }}>12,408</span> log lines/minute across <span className="tag-mono" style={{ color: "var(--ink)" }}>4</span> environments. Pick an app below to start a fix.
      </div>

      <section className="section">
        <div className="section-head">
          <div className="section-title">Environments</div>
          <div className="section-meta">Updated · 4s ago</div>
        </div>
        {envEmphasis === "strip" ? (
          <div className="env-strip">
            {data.environments.map((e) => (
              <div key={e.id} className="env-strip-cell" data-env={e.id} data-status={e.status}>
                <div className="env-head">
                  <div className="env-logo">{e.name.slice(0, 3).toUpperCase()}</div>
                  <div>
                    <div className="env-name">{e.name}</div>
                    <div className="env-kind">{e.kind}</div>
                  </div>
                  <div className="env-pulse" style={{ marginLeft: "auto" }}>
                    <span className="pulse-dot" />{e.status}
                  </div>
                </div>
                <div className="env-grid-row">
                  <span><b>{e.instances}</b> inst</span>
                  <span style={{ color: e.errors > 0 ? "var(--coral-deep)" : "var(--ink-soft)" }}>
                    <b>{e.errors}</b> errors
                  </span>
                  <span><b>{e.health}%</b> health</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="env-grid">
            {data.environments.map((e) => (
              <EnvCard key={e.id} env={e} />
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div className="section-title">Apps reporting errors</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Icon.search style={{ position: "absolute", left: 9, top: 8, color: "var(--ink-mute)" }} width="14" height="14" />
              <input
                className="input"
                placeholder="Search app or error"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ paddingLeft: 28, width: 220, padding: "7px 12px 7px 28px" }}
              />
            </div>
            <select className="select" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 130, padding: "7px 10px" }}>
              <option value="all">All environments</option>
              {data.environments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        <div className="app-list">
          <div className="app-row head">
            <div>App</div><div>Env</div><div>Severity</div><div>Error</div><div>Hits</div><div>Last seen</div><div></div>
          </div>
          {apps.map((a) => (
            <div key={a.id} className="app-row" onClick={() => onPickApp(a)}>
              <div>
                <div className="app-name">{a.name}</div>
                <div className="app-lang">{a.lang}</div>
              </div>
              <div><EnvBadge env={a.env} /></div>
              <div><SevBadge sev={a.severity} /></div>
              <div style={{ minWidth: 0 }}>
                <div className="app-err-type">{a.errorType}</div>
                <div className="app-err-msg">{a.error.split("\n")[0]}</div>
              </div>
              <div className="app-occ">{a.occurrences}</div>
              <div className="app-seen">{a.lastSeen}</div>
              <div>
                <button className="app-fix-btn" onClick={(e) => { e.stopPropagation(); onPickApp(a); }}>
                  <span className="glyph" />
                  Fix
                </button>
              </div>
            </div>
          ))}
          {apps.length === 0 && (
            <div style={{ padding: 36, textAlign: "center", color: "var(--ink-mute)", fontSize: 13 }}>
              No apps match those filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { Dashboard });
