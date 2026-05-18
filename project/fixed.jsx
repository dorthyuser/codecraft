/* Auro Heal — Fixed Apps page (history of healed apps + re-fix) */
const { useState: useFxS, useMemo: useFxM } = React;

function FixedApps({ items, onRefix }) {
  const [q, setQ] = useFxS("");
  const filtered = useFxM(() => {
    if (!q) return items;
    const t = q.toLowerCase();
    return items.filter((i) => i.app.toLowerCase().includes(t) || i.errorType.toLowerCase().includes(t));
  }, [items, q]);

  const totalAdd = items.reduce((n, i) => n + i.additions, 0);
  const totalDel = items.reduce((n, i) => n + i.deletions, 0);

  return (
    <div data-screen-label="02 Fixed Apps">
      <div className="page-head">
        <div>
          <div className="page-eyebrow">History</div>
          <h1 className="page-title">Healed apps</h1>
          <p className="page-sub">Every fix Auro has shipped. Re-run if the issue returns or you want to try a different prompt.</p>
        </div>
        <div className="head-stats">
          <div className="stat"><div className="stat-val">{items.length}</div><div className="stat-lbl">Total fixes</div></div>
          <div className="stat good"><div className="stat-val">+{totalAdd}</div><div className="stat-lbl">Lines added</div></div>
          <div className="stat alert"><div className="stat-val">−{totalDel}</div><div className="stat-lbl">Lines removed</div></div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Icon.search style={{ position: "absolute", left: 10, top: 9, color: "var(--ink-mute)" }} width="14" height="14" />
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by app or error type"
            style={{ paddingLeft: 30 }}
          />
        </div>
        <div className="tag-mono" style={{ marginLeft: "auto" }}>
          Showing {filtered.length} of {items.length}
        </div>
      </div>

      <div className="fixed-table">
        <div className="fixed-row head">
          <div>App</div><div>Env</div><div>Fix summary</div><div>Diff</div><div>Commit</div><div>When</div><div></div>
        </div>
        {filtered.map((i) => (
          <div key={i.id} className="fixed-row">
            <div>
              <div className="app-name">{i.app}</div>
              <div className="app-lang">{i.errorType}</div>
            </div>
            <div><EnvBadge env={i.env} /></div>
            <div style={{ color: "var(--ink-soft)", fontSize: 13 }}>{i.summary}</div>
            <div className="tag-mono">
              <span style={{ color: "var(--teal-deep)" }}>+{i.additions}</span>
              {" / "}
              <span style={{ color: "var(--coral-deep)" }}>−{i.deletions}</span>
            </div>
            <div className="fixed-commit">
              <Icon.git width="12" height="12" />
              <code>{i.commit}</code>
              <span style={{ color: "var(--ink-faint)" }}>·</span>
              <span>{i.branch}</span>
            </div>
            <div className="tag-mono" style={{ color: "var(--ink-soft)" }}>
              {i.fixedAt}<br />
              <span style={{ color: "var(--ink-faint)" }}>{i.duration}</span>
            </div>
            <div>
              <button className="btn btn-small" onClick={() => onRefix(i)}>
                <Icon.refresh width="11" height="11" /> Fix again
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 36, textAlign: "center", color: "var(--ink-mute)" }}>No fixes match.</div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { FixedApps });
